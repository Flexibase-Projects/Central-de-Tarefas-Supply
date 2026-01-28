export default function Dashboard() {
  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder para métricas futuras */}
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Projetos Ativos
          </div>
          <div className="mt-2 text-2xl font-bold">-</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Tarefas em Andamento
          </div>
          <div className="mt-2 text-2xl font-bold">-</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Próximas Revisões
          </div>
          <div className="mt-2 text-2xl font-bold">-</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Concluídos
          </div>
          <div className="mt-2 text-2xl font-bold">-</div>
        </div>
      </div>
    </div>
  )
}
