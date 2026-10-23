# Expansão integrada — Recursos e Equipamentos

## Objetivo
Adicionar gestão de salas, carrinhos, inventário e reservas à aplicação atual da E.E. Dr. Antônio Moraes Barros, preservando retiradas, chamados, tarefas, notas, logs e compatibilidade com a versão estática do Vercel.

## 1. Preparação e acesso
- Corrigir o erro de tipagem já identificado na tela geral de erros antes de acrescentar as novas telas.
- Reutilizar o login existente: consulta de disponibilidade sem login; reservas e consulta das próprias solicitações com identificação; gestão de inventário e movimentações restrita a responsáveis autorizados.
- Criar permissões separadas dos perfis. Sua conta será o primeiro responsável, após confirmar sua identidade no sistema. Não conceder administração automaticamente ao primeiro cadastro.
- Não alterar o acesso das funcionalidades antigas nesta expansão.

## 2. Inventário real
- Criar localizações para os quatro carrinhos e as duas salas, com cadastro futuro de plataformas e equipamentos.
- Cadastrar, sem duplicações, 40 + 31 + 31 + 30 notebooks e 23 + 16 desktops: 132 notebooks, 39 desktops, 171 dispositivos.
- Usar registros internos sem inventar números patrimoniais. Permitir identificação patrimonial posterior e gestão por quantidade através da seleção de unidades internas.
- Não converter retiradas antigas em inventário nem inferir marca ou carrinho a partir delas. Preservá-las e oferecer vinculação explícita quando houver identificação real.
- Iniciar os notebooks sem habilitação de empréstimo e com bateria/condição desconhecidas. Desktops também terão condição pendente de verificação. Totais cadastrados não serão exibidos como disponibilidade.

## 3. Salas e agenda
- Adicionar a aba **Recursos e Equipamentos**, com seções de notebooks, Sala 09 e Sala Maker, integrada à navegação e aos atalhos iniciais.
- Mostrar inventário dos desktops, condições individuais, disponibilidade da sala e próximas reservas separadamente.
- Implementar agenda diária e semanal, formulários com professor, período e campos opcionais de alunos, finalidade e observações.
- Reservar cada sala inteira, impedir conflitos e permitir cancelamento pelo próprio professor antes do início ou pelo responsável autorizado.
- Confirmar reservas automaticamente por padrão; disponibilizar configuração administrativa para exigir aprovação. Solicitações pendentes também reterão disponibilidade até aprovação ou cancelamento.
- Reservas de salas e notebooks permanecerão independentes. Não acrescentar um fluxo combinado nesta etapa.

## 4. Notebooks, bateria e movimentação
- Permitir habilitar carrinhos e definir as unidades disponíveis para empréstimo, respeitando os limites cadastrados.
- Consultar e filtrar equipamentos por carrinho, local, bateria, condição e situação de empréstimo.
- Reservar quantidades por período, verificando a capacidade durante todo o intervalo, inclusive sob solicitações simultâneas.
- Registrar retiradas e devoluções parciais com responsável, destino, horário, bateria, problemas e observações; vincular às retiradas existentes sem duplicar o empréstimo.
- Registrar transferências, armazenamento e carregamento separadamente; validar ocupação e capacidade da plataforma de destino.
- Usar as cinco categorias de bateria fornecidas, mais estado desconhecido, sem porcentagens inventadas. Exigir observação válida para liberar empréstimos; permitir configurar validade das observações e categorias aceitas, inicialmente bloqueadas até configuração autorizada.
- Mostrar histórico de bateria inicial/final e duração real; não gerar previsões de autonomia sem evidência suficiente.

## 5. Indicadores e histórico
- Separar totais de inventário dos números operacionais: habilitados, livres, reservados, em uso, carregando, fora dos carrinhos, indisponíveis e não verificados.
- Calcular indicadores exclusivamente dos registros persistidos e dos períodos selecionados.
- Integrar eventos ao histórico atual de logs, incluindo autor, recurso e detalhes, e manter histórico confiável das movimentações no novo módulo.
- Preservar a identidade visual e verificar computadores, tablets e celulares; estados terão texto além de cor.

## Detalhes técnicos
- Manter TanStack Router, componentes atuais e acesso do navegador ao Lovable Cloud, compatíveis com a SPA do Vercel; não introduzir dependência de servidor próprio do Vercel.
- Acrescentar tabelas de recursos/localizações, equipamentos, reservas, alocações e movimentos somente onde não há estrutura equivalente. Estender `netbook_loans` para vincular operações novas, preservando colunas e registros antigos.
- Aplicar permissões no banco, com políticas de acesso e concessões explícitas. Consultas públicas expõem disponibilidade, não nomes e observações privadas de professores.
- Executar reservas e movimentações por operações transacionais no banco, com bloqueios para concorrência, validação de quantidades, estados e capacidade; não depender apenas dos controles da tela.
- Registrar regras de arquitetura e manter uma lista das etapas e eventuais impedimentos.

## Validação
- Testar inventário oficial e ausência de duplicações; independência das três reservas; conflitos simultâneos; limite de habilitação; bateria desconhecida; devolução parcial/excessiva; localização e capacidade; restrições de professor e visitante.
- Executar o fluxo completo com conta identificada: configuração autorizada, reserva, retirada, devolução, histórico e leitura após atualização da página.
- Verificar que as funcionalidades antigas continuam acessíveis, que a nova aba não quebra a navegação e que não há erros na tela ou no console.
- A validação do site já hospedado no Vercel dependerá de seu endereço e de atualizar a versão hospedada; verificar localmente não será descrito como teste do Vercel.

## Pendências que exigem informação real
- Identificar sua conta para conceder a primeira permissão administrativa; não há perfis cadastrados no banco consultado.
- Conferir condições físicas, bateria, habilitação, localização atual e eventual vínculo das retiradas antigas antes de liberar unidades.
- Confirmar limites operacionais configuráveis, como validade das observações de bateria e categorias aceitas para empréstimo.

Ao concluir, informar alterações, estruturas acrescentadas, testes executados e pendências de configuração, sem apresentar dados não verificados como disponíveis.