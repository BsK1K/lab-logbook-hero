CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
CREATE TABLE public.school_resources(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL, name text NOT NULL, kind text NOT NULL CHECK(kind IN ('room','cart','platform')), location text NOT NULL, capacity integer NOT NULL DEFAULT 0 CHECK(capacity>=0), enabled boolean NOT NULL DEFAULT false, requires_approval boolean NOT NULL DEFAULT false, battery_valid_hours integer NOT NULL DEFAULT 0 CHECK(battery_valid_hours>=0), accepted_battery integer[] NOT NULL DEFAULT '{}' CHECK(accepted_battery <@ ARRAY[1,2,3,4,5]));
GRANT SELECT ON public.school_resources TO anon,authenticated; GRANT ALL ON public.school_resources TO service_role;
ALTER TABLE public.school_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY resources_read ON public.school_resources FOR SELECT TO anon,authenticated USING(true);
CREATE TABLE public.school_equipment(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), home_id uuid NOT NULL REFERENCES public.school_resources(id), current_location_id uuid REFERENCES public.school_resources(id), internal_index integer NOT NULL CHECK(internal_index>0), asset_code text UNIQUE, kind text NOT NULL CHECK(kind IN ('notebook','desktop')), enabled boolean NOT NULL DEFAULT false, condition text NOT NULL DEFAULT 'unknown' CHECK(condition IN ('unknown','operational','maintenance','damaged')), state text NOT NULL DEFAULT 'stored' CHECK(state IN ('stored','charging','outside','in_use')), battery integer CHECK(battery BETWEEN 1 AND 5), battery_observed_at timestamptz, destination text, UNIQUE(home_id,internal_index));
GRANT SELECT ON public.school_equipment TO anon,authenticated; GRANT ALL ON public.school_equipment TO service_role;
ALTER TABLE public.school_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY equipment_read ON public.school_equipment FOR SELECT TO anon,authenticated USING(true);
CREATE TABLE public.school_reservations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), resource_id uuid NOT NULL REFERENCES public.school_resources(id), user_id uuid NOT NULL, teacher text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, quantity integer NOT NULL DEFAULT 1 CHECK(quantity>0), destination text NOT NULL DEFAULT '', students integer CHECK(students>=0), purpose text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'confirmed' CHECK(status IN ('pending','confirmed','cancelled','completed')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.school_reservations TO authenticated; GRANT ALL ON public.school_reservations TO service_role;
ALTER TABLE public.school_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY reservations_own ON public.school_reservations FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.school_allocations(reservation_id uuid NOT NULL REFERENCES public.school_reservations(id), equipment_id uuid NOT NULL REFERENCES public.school_equipment(id), PRIMARY KEY(reservation_id,equipment_id));
GRANT SELECT ON public.school_allocations TO authenticated; GRANT ALL ON public.school_allocations TO service_role;
ALTER TABLE public.school_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY allocations_own ON public.school_allocations FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.school_reservations r WHERE r.id=reservation_id AND (r.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE TABLE public.school_movements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), equipment_id uuid NOT NULL REFERENCES public.school_equipment(id), reservation_id uuid REFERENCES public.school_reservations(id), loan_id uuid REFERENCES public.netbook_loans(id), actor_id uuid NOT NULL, action text NOT NULL CHECK(action IN ('checkout','return','transfer','inspect')), battery integer CHECK(battery BETWEEN 1 AND 5), destination_id uuid REFERENCES public.school_resources(id), destination text, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.school_movements TO authenticated; GRANT ALL ON public.school_movements TO service_role;
ALTER TABLE public.school_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY movements_admin ON public.school_movements FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.school_reservations r WHERE r.id=reservation_id AND r.user_id=auth.uid()));
ALTER TABLE public.netbook_loans ADD COLUMN school_reservation_id uuid REFERENCES public.school_reservations(id);
CREATE INDEX school_reservation_times ON public.school_reservations(resource_id,starts_at,ends_at);
CREATE INDEX school_movement_equipment ON public.school_movements(equipment_id,created_at);
CREATE FUNCTION public.school_lock() RETURNS void LANGUAGE sql SET search_path=public AS $$ SELECT pg_advisory_xact_lock(76132911) $$;
REVOKE ALL ON FUNCTION public.school_lock() FROM PUBLIC;
CREATE FUNCTION public.school_available(p_resource uuid,p_start timestamptz,p_end timestamptz) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT e.id FROM public.school_equipment e JOIN public.school_resources c ON c.id=e.home_id
WHERE e.home_id=p_resource AND e.kind='notebook' AND c.enabled AND e.enabled AND e.condition='operational' AND e.state='stored' AND e.current_location_id IS NOT NULL AND e.battery=ANY(c.accepted_battery) AND c.battery_valid_hours>0 AND e.battery_observed_at>=now()-make_interval(hours=>c.battery_valid_hours)
AND NOT EXISTS(SELECT 1 FROM public.school_allocations a JOIN public.school_reservations r ON r.id=a.reservation_id WHERE a.equipment_id=e.id AND r.status IN ('pending','confirmed') AND r.starts_at<p_end AND r.ends_at>p_start) ORDER BY e.internal_index $$;
REVOKE ALL ON FUNCTION public.school_available(uuid,timestamptz,timestamptz) FROM PUBLIC;
CREATE FUNCTION public.school_snapshot(p_start timestamptz,p_end timestamptz) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF p_start IS NULL OR p_end IS NULL OR p_end<=p_start THEN RAISE EXCEPTION 'Período inválido'; END IF;
RETURN jsonb_build_object('resources',(SELECT coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('available',(SELECT count(*) FROM public.school_available(c.id,p_start,p_end)), 'schedule',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'starts_at',r.starts_at,'ends_at',r.ends_at,'quantity',r.quantity,'status',r.status) ORDER BY r.starts_at),'[]'::jsonb) FROM public.school_reservations r WHERE r.resource_id=c.id AND r.status IN ('pending','confirmed') AND r.starts_at<p_end AND r.ends_at>p_start))), '[]'::jsonb) FROM public.school_resources c), 'equipment',(SELECT coalesce(jsonb_agg(to_jsonb(e)-'destination'),'[]'::jsonb) FROM public.school_equipment e)); END $$;
REVOKE ALL ON FUNCTION public.school_snapshot(timestamptz,timestamptz) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.school_snapshot(timestamptz,timestamptz) TO anon,authenticated;
CREATE FUNCTION public.school_audit(p_action text,p_id uuid,p_text text,p_meta jsonb) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ INSERT INTO public.activity_logs(action,entity,entity_id,description,metadata) VALUES(p_action,'recurso',p_id,p_text,p_meta||jsonb_build_object('actor_id',auth.uid())); $$;
REVOKE ALL ON FUNCTION public.school_audit(text,uuid,text,jsonb) FROM PUBLIC;
CREATE FUNCTION public.school_action(p_action text,p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); admin boolean; rid uuid; res public.school_resources; booking public.school_reservations; eq public.school_equipment; ids uuid[]; n integer; bat integer; target uuid; loan uuid; q integer; s timestamptz; t timestamptz;
BEGIN
IF uid IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para continuar'; END IF;
admin:=public.has_role(uid,'admin'); PERFORM public.school_lock();
IF p_action='reserve' THEN
rid:=(p_data->>'resource_id')::uuid; SELECT * INTO res FROM public.school_resources WHERE id=rid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Recurso não encontrado'; END IF;
s:=(p_data->>'starts_at')::timestamptz; t:=(p_data->>'ends_at')::timestamptz; q:=coalesce((p_data->>'quantity')::integer,1);
IF s IS NULL OR t IS NULL OR s<now() OR t<=s OR q<1 OR trim(coalesce(p_data->>'teacher',''))='' THEN RAISE EXCEPTION 'Informe responsável, quantidade e período futuro válido'; END IF;
IF res.kind='platform' THEN RAISE EXCEPTION 'Plataforma não é recurso reservável'; END IF;
IF res.kind='room' THEN q:=1; IF EXISTS(SELECT 1 FROM public.school_reservations WHERE resource_id=rid AND status IN ('pending','confirmed') AND starts_at<t AND ends_at>s) THEN RAISE EXCEPTION 'A sala já está reservada neste período'; END IF;
ELSE
IF trim(coalesce(p_data->>'destination',''))='' THEN RAISE EXCEPTION 'Informe a sala de destino'; END IF;
SELECT array_agg(v) INTO ids FROM (SELECT v FROM public.school_available(rid,s,t) v LIMIT q) a; IF coalesce(cardinality(ids),0)<q THEN RAISE EXCEPTION 'Quantidade indisponível para o período solicitado'; END IF;
END IF;
INSERT INTO public.school_reservations(resource_id,user_id,teacher,starts_at,ends_at,quantity,destination,students,purpose,notes,status) VALUES(rid,uid,p_data->>'teacher',s,t,q,coalesce(p_data->>'destination',''),nullif(p_data->>'students','')::integer,coalesce(p_data->>'purpose',''),coalesce(p_data->>'notes',''),CASE WHEN res.requires_approval THEN 'pending' ELSE 'confirmed' END) RETURNING id INTO rid;
IF ids IS NOT NULL THEN INSERT INTO public.school_allocations SELECT rid,unnest(ids); END IF;
PERFORM public.school_audit('criar',rid,'Reserva: '||res.name,jsonb_build_object('quantity',q,'starts_at',s,'ends_at',t)); RETURN rid;
END IF;
IF p_action IN ('cancel','approve','checkout','return') THEN
rid:=(p_data->>'id')::uuid; SELECT * INTO booking FROM public.school_reservations WHERE id=rid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
IF NOT admin AND booking.user_id<>uid THEN RAISE EXCEPTION 'Sem permissão'; END IF;
IF p_action='cancel' THEN
IF booking.status NOT IN ('pending','confirmed') OR (NOT admin AND booking.starts_at<=now()) OR EXISTS(SELECT 1 FROM public.school_equipment e JOIN public.school_allocations a ON a.equipment_id=e.id WHERE a.reservation_id=rid AND e.state='in_use') THEN RAISE EXCEPTION 'Esta reserva não pode ser cancelada'; END IF;
UPDATE public.school_reservations SET status='cancelled' WHERE id=rid;
ELSIF p_action='approve' THEN
IF NOT admin OR booking.status<>'pending' THEN RAISE EXCEPTION 'Aprovação não autorizada'; END IF; UPDATE public.school_reservations SET status='confirmed' WHERE id=rid;
ELSE
IF NOT admin THEN RAISE EXCEPTION 'Movimentação exige responsável autorizado'; END IF;
SELECT * INTO res FROM public.school_resources WHERE id=booking.resource_id; IF res.kind<>'cart' THEN RAISE EXCEPTION 'A reserva não é de notebooks'; END IF;
bat:=(p_data->>'battery')::integer; IF bat IS NULL OR bat NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Informe o nível de bateria observado'; END IF;
q:=(p_data->>'quantity')::integer; IF q IS NULL OR q<1 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
IF p_action='checkout' THEN
IF booking.status<>'confirmed' OR now()<booking.starts_at OR now()>=booking.ends_at THEN RAISE EXCEPTION 'Retirada permitida apenas durante reserva confirmada'; END IF;
IF NOT res.enabled OR NOT bat=ANY(res.accepted_battery) THEN RAISE EXCEPTION 'Carrinho ou bateria não habilitado'; END IF;
SELECT array_agg(id) INTO ids FROM (SELECT e.id FROM public.school_equipment e JOIN public.school_allocations a ON a.equipment_id=e.id WHERE a.reservation_id=rid AND e.enabled AND e.condition='operational' AND e.state='stored' AND NOT EXISTS(SELECT 1 FROM public.school_movements m WHERE m.reservation_id=rid AND m.equipment_id=e.id AND m.action='checkout') ORDER BY e.internal_index LIMIT q) v;
IF coalesce(cardinality(ids),0)<>q THEN RAISE EXCEPTION 'Quantidade não disponível para retirada'; END IF;
loan:=nullif(p_data->>'legacy_loan_id','')::uuid;
IF loan IS NOT NULL THEN
IF NOT EXISTS(SELECT 1 FROM public.netbook_loans WHERE id=loan AND devolvido_at IS NULL AND school_reservation_id IS NULL AND qtd_positivo+qtd_multilaser=q FOR UPDATE) THEN RAISE EXCEPTION 'Retirada antiga incompatível; confira a quantidade total'; END IF;
UPDATE public.netbook_loans SET school_reservation_id=rid WHERE id=loan;
END IF;
UPDATE public.school_equipment SET state='in_use',current_location_id=NULL,destination=booking.destination,battery=bat,battery_observed_at=now() WHERE id=ANY(ids);
ELSE
IF booking.status<>'confirmed' THEN RAISE EXCEPTION 'Reserva não está em uso'; END IF;
target:=(p_data->>'destination_id')::uuid; SELECT * INTO res FROM public.school_resources WHERE id=target FOR UPDATE;
IF NOT FOUND OR res.kind='room' THEN RAISE EXCEPTION 'Selecione um carrinho ou plataforma'; END IF;
SELECT array_agg(id) INTO ids FROM (SELECT e.id FROM public.school_equipment e JOIN public.school_allocations a ON a.equipment_id=e.id WHERE a.reservation_id=rid AND e.state='in_use' AND EXISTS(SELECT 1 FROM public.school_movements m WHERE m.equipment_id=e.id AND m.reservation_id=rid AND m.action='checkout') ORDER BY e.internal_index LIMIT q) v;
IF coalesce(cardinality(ids),0)<>q THEN RAISE EXCEPTION 'Devolução superior à quantidade ainda retirada'; END IF;
IF (SELECT count(*) FROM public.school_equipment WHERE current_location_id=target)+q>res.capacity THEN RAISE EXCEPTION 'Capacidade do destino excedida'; END IF;
UPDATE public.school_equipment SET state='stored',current_location_id=target,destination=NULL,battery=bat,battery_observed_at=now(),condition=CASE WHEN coalesce((p_data->>'damaged')::boolean,false) THEN 'damaged' ELSE condition END WHERE id=ANY(ids);
END IF;
INSERT INTO public.school_movements(equipment_id,reservation_id,loan_id,actor_id,action,battery,destination_id,destination,notes) SELECT unnest(ids),rid,loan,uid,p_action,bat,target,booking.destination,coalesce(p_data->>'notes','');
IF p_action='return' AND NOT EXISTS(SELECT 1 FROM public.school_equipment e JOIN public.school_allocations a ON a.equipment_id=e.id WHERE a.reservation_id=rid AND e.state='in_use') AND (SELECT count(*) FROM public.school_movements WHERE reservation_id=rid AND action='checkout')=booking.quantity THEN UPDATE public.school_reservations SET status='completed' WHERE id=rid; UPDATE public.netbook_loans SET devolvido_at=now() WHERE school_reservation_id=rid; END IF;
END IF;
PERFORM public.school_audit(CASE WHEN p_action='checkout' THEN 'retirar' WHEN p_action='return' THEN 'devolver' ELSE 'status' END,rid,'Recurso: '||p_action,p_data-'teacher'); RETURN rid;
END IF;
IF NOT admin THEN RAISE EXCEPTION 'Apenas responsáveis autorizados podem alterar o inventário'; END IF;
IF p_action='configure' THEN
rid:=(p_data->>'id')::uuid; n:=(p_data->>'enabled_quantity')::integer;
SELECT * INTO res FROM public.school_resources WHERE id=rid FOR UPDATE;
IF NOT FOUND OR n IS NULL OR n<0 OR n>(SELECT count(*) FROM public.school_equipment WHERE home_id=rid) THEN RAISE EXCEPTION 'Quantidade habilitada inválida'; END IF;
IF EXISTS(SELECT 1 FROM public.school_equipment e WHERE e.home_id=rid AND e.internal_index>n AND (e.state='in_use' OR EXISTS(SELECT 1 FROM public.school_allocations a JOIN public.school_reservations r ON r.id=a.reservation_id WHERE a.equipment_id=e.id AND r.status IN ('pending','confirmed') AND r.ends_at>now()))) THEN RAISE EXCEPTION 'Há unidades reservadas ou em uso; cancele ou devolva antes de desabilitar'; END IF;
IF NOT coalesce((p_data->>'enabled')::boolean,false) AND EXISTS(SELECT 1 FROM public.school_reservations WHERE resource_id=rid AND status IN ('pending','confirmed') AND ends_at>now()) THEN RAISE EXCEPTION 'Carrinho possui reservas ativas'; END IF;
UPDATE public.school_resources SET enabled=coalesce((p_data->>'enabled')::boolean,false),requires_approval=coalesce((p_data->>'requires_approval')::boolean,false),battery_valid_hours=coalesce((p_data->>'battery_valid_hours')::integer,0),accepted_battery=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_data->'accepted_battery','[]'::jsonb))::integer) WHERE id=rid;
UPDATE public.school_equipment SET enabled=(internal_index<=n) WHERE home_id=rid;
ELSIF p_action IN ('inspect','transfer') THEN
rid:=(p_data->>'id')::uuid; SELECT * INTO eq FROM public.school_equipment WHERE id=rid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Equipamento não encontrado'; END IF;
IF eq.state='in_use' AND eq.kind='notebook' THEN RAISE EXCEPTION 'Devolva o equipamento antes de alterar'; END IF;
IF p_action='inspect' THEN
IF EXISTS(SELECT 1 FROM public.school_allocations a JOIN public.school_reservations r ON r.id=a.reservation_id WHERE a.equipment_id=rid AND r.status IN ('pending','confirmed') AND r.ends_at>now()) AND p_data->>'condition'<>'operational' THEN RAISE EXCEPTION 'Cancele a reserva antes de tornar o equipamento indisponível'; END IF;
bat:=nullif(p_data->>'battery','')::integer;
UPDATE public.school_equipment SET asset_code=nullif(p_data->>'asset_code',''),condition=p_data->>'condition',battery=bat,battery_observed_at=CASE WHEN bat IS NULL THEN NULL ELSE now() END,state=CASE WHEN kind='desktop' THEN coalesce(p_data->>'state',state) ELSE state END WHERE id=rid;
ELSE
target:=nullif(p_data->>'destination_id','')::uuid;
IF eq.kind<>'notebook' OR p_data->>'state' NOT IN ('stored','charging','outside') THEN RAISE EXCEPTION 'Movimentação inválida'; END IF;
IF p_data->>'state'='outside' THEN target:=NULL; ELSE
SELECT * INTO res FROM public.school_resources WHERE id=target FOR UPDATE;
IF NOT FOUND OR res.kind='room' OR (SELECT count(*) FROM public.school_equipment WHERE current_location_id=target AND id<>rid)>=res.capacity THEN RAISE EXCEPTION 'Destino inválido ou sem espaço'; END IF;
END IF;
UPDATE public.school_equipment SET current_location_id=target,state=p_data->>'state',destination=nullif(p_data->>'destination','') WHERE id=rid;
END IF;
INSERT INTO public.school_movements(equipment_id,actor_id,action,battery,destination_id,notes) VALUES(rid,uid,p_action,bat,target,coalesce(p_data->>'notes',''));
ELSIF p_action='platform' THEN
INSERT INTO public.school_resources(code,name,kind,location,capacity) VALUES('platform-'||gen_random_uuid(),p_data->>'name','platform',p_data->>'location',(p_data->>'capacity')::integer) RETURNING id INTO rid;
ELSE RAISE EXCEPTION 'Operação desconhecida'; END IF;
PERFORM public.school_audit('editar',rid,'Inventário: '||p_action,p_data); RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.school_action(text,jsonb) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.school_action(text,jsonb) TO authenticated;
CREATE FUNCTION public.guard_linked_school_loan() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF OLD.school_reservation_id IS NOT NULL AND current_user IN ('anon','authenticated','authenticator') THEN RAISE EXCEPTION 'Use Recursos e Equipamentos para alterar esta retirada vinculada'; END IF; IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END $$;
CREATE TRIGGER guard_school_loan BEFORE UPDATE OR DELETE ON public.netbook_loans FOR EACH ROW EXECUTE FUNCTION public.guard_linked_school_loan();