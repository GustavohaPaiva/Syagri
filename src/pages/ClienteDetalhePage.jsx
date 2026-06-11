import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ClienteDetailStats,
  ClienteInfoPanel,
  ClienteProfileHero,
  ClienteSimulationsTable,
} from "../components/clientes/ClienteDetailVisuals";
import { ModalClienteForm } from "../components/clientes/ModalClienteForm";
import { AlertMessage } from "../components/ui/AlertMessage";
import { EmptyState } from "../components/ui/EmptyState";
import { PageBackLink } from "../components/ui/PageBackLink";
import { useSyncPageLoading } from "../contexts/PageLoadingContext";
import { useAbortableAsync } from "../hooks/useAbortableAsync";
import { useAuth } from "../hooks/useAuth";
import {
  fetchClientById,
  fetchClientSimulations,
} from "../services/clientService";

export function ClienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isGestor = role === "gestor";
  const [client, setClient] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useSyncPageLoading(loading);

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!id) return;

      setLoading(true);
      setError(null);

      const [clientRes, simRes] = await Promise.all([
        fetchClientById(id),
        fetchClientSimulations(id),
      ]);

      if (!isActive()) return;

      setLoading(false);

      if (!clientRes.ok) {
        setError(clientRes.error);
        setClient(null);
        setSimulations([]);
        return;
      }
      if (!simRes.ok) {
        setError(simRes.error);
        setClient(clientRes.client);
        setSimulations([]);
        return;
      }

      setClient(clientRes.client);
      setSimulations(simRes.rows);
    },
    [id],
    Boolean(id),
  );

  const stats = useMemo(() => {
    const total = simulations.length;
    const vendas = simulations.filter((s) => s.status === "converted").length;
    const volume = simulations.reduce(
      (acc, s) => acc + Number(s.total_proposta ?? 0),
      0,
    );
    return { total, vendas, volume };
  }, [simulations]);

  const conversionRate =
    stats.total > 0 ? Math.round((stats.vendas / stats.total) * 100) : 0;

  if (!id) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <PageBackLink to="/clientes">Voltar para clientes</PageBackLink>
        <AlertMessage>Cliente não informado.</AlertMessage>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <PageBackLink to="/clientes">Voltar para clientes</PageBackLink>

      {loading ? (
        <EmptyState
          title="Carregando cliente…"
          description="Aguarde um instante."
        />
      ) : error && !client ? (
        <AlertMessage>{error}</AlertMessage>
      ) : client ? (
        <>
          <ClienteProfileHero client={client} />

          <ClienteDetailStats
            stats={stats}
            conversionRate={conversionRate}
            loading={loading}
          />

          {error ? <AlertMessage>{error}</AlertMessage> : null}

          <ClienteInfoPanel
            client={client}
            isGestor={isGestor}
            onEdit={() => setEditOpen(true)}
          />

          <ClienteSimulationsTable
            rows={simulations}
            loading={false}
            emptyMessage="Nenhuma simulação ou compra registrada para este cliente."
            onViewPedido={(simId) => navigate(`/pedido/${simId}`)}
          />

          <ModalClienteForm
            open={editOpen}
            mode="edit"
            clientId={client.id}
            initial={client}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              setClient(updated);
              setEditOpen(false);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
