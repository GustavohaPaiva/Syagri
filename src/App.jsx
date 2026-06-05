import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppConfigError } from './components/AppConfigError'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthProvider'
import { MainLayout } from './layouts/MainLayout'
import { AdminPage } from './pages/AdminPage'
import { ClienteDetalhePage } from './pages/ClienteDetalhePage'
import { ConsultorDetalhePage } from './pages/ConsultorDetalhePage'
import { DashboardPage } from './pages/DashboardPage'
import { GerenciarClientes } from './pages/GerenciarClientes'
import { GerenciarConsultores } from './pages/GerenciarConsultores'
import { GestaoMoedasPage } from './pages/GestaoMoedasPage'
import { ConstrutorMapeamento } from './pages/ConstrutorMapeamento'
import { ImportacaoProdutos } from './pages/ImportacaoProdutos'
import { ListagemSimulacoes } from './pages/ListagemSimulacoes'
import { Login } from './pages/Login'
import { ParametrosPage } from './pages/ParametrosPage'
import { PedidoPage } from './pages/PedidoPage'
import { PedidosPage } from './pages/PedidosPage'
import { SimuladorPage } from './pages/SimuladorPage'
import { supabaseConfigError } from './services/supabase'

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export default function App() {
  if (supabaseConfigError) {
    return <AppConfigError message={supabaseConfigError} />
  }

  return (
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="simulador" element={<SimuladorPage />} />
            <Route path="pedido/:simulationId" element={<PedidoPage />} />
            <Route path="simulacoes" element={<ListagemSimulacoes />} />
            <Route path="clientes" element={<GerenciarClientes />} />
            <Route path="clientes/:id" element={<ClienteDetalhePage />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route
              path="parametros"
              element={
                <ProtectedRoute roles={['gestor']}>
                  <ParametrosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={['gestor']}>
                  <Outlet />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminPage />} />
              <Route path="consultores" element={<GerenciarConsultores />} />
              <Route path="consultores/:id" element={<ConsultorDetalhePage />} />
              <Route path="importacao" element={<ImportacaoProdutos />} />
              <Route
                path="importacao/mapeamento"
                element={<ConstrutorMapeamento />}
              />
              <Route path="moedas" element={<GestaoMoedasPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
