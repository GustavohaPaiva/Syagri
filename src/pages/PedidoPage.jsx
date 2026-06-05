import { Navigate, useParams } from 'react-router-dom'
import { Pedido } from './Pedido'

export function PedidoPage() {
  const { simulationId } = useParams()
  if (!simulationId) {
    return <Navigate to="/simulador" replace />
  }
  return <Pedido simulationId={simulationId} />
}
