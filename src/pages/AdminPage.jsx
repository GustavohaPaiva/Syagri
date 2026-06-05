

/** Rota de exemplo: apenas gestores (ver `App.tsx` + `ProtectedRoute`). */
export function AdminPage() {
  return (
    <div className="w-full py-6">
      <h1 className="text-xl font-semibold text-slate-900">Área administrativa</h1>
      <p className="mt-2 text-slate-600">
        Esta rota está protegida para o papel <span className="font-medium">gestor</span>.
      </p>
    </div>
  )
}
