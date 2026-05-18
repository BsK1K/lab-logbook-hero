import { createFileRoute, Link } from "@tanstack/react-router";
import { Laptop, Wrench } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <h1 className="text-2xl font-semibold">Sala de Informática</h1>
          <p className="text-sm text-muted-foreground">Controle de netbooks e chamados</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/netbooks"
            className="group rounded-xl border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <Laptop className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Netbooks</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registrar retiradas e devoluções de aparelhos.
            </p>
          </Link>

          <Link
            to="/chamados"
            className="group rounded-xl border bg-card p-6 transition hover:border-primary hover:shadow-md"
          >
            <Wrench className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Chamados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registrar aparelhos danificados com fotos.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
