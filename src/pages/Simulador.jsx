import { useCallback, useMemo, useState } from 'react'
import { useAlertDialog } from '../contexts/AlertDialogProvider'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ModalClienteForm } from "../components/clientes/ModalClienteForm";
import {
  SIMULADOR_SECTION_ICONS,
  SimuladorSectionPanel,
  SimuladorSummaryBar,
} from "../components/simulador/SimuladorVisuals";
import { SimulationLineCard } from "../components/simulador/SimulationLineCard";
import { SimulationLinesTable } from "../components/simulador/SimulationLinesTable";
import { IconClipboardList } from "../components/icons";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { Combobox } from "../components/ui/Combobox";
import { EmptyState } from "../components/ui/EmptyState";
import { FormattedInput } from "../components/ui/FormattedInput";
import { Input } from "../components/ui/Input";
import { PageBackLink } from "../components/ui/PageBackLink";
import { PageHeader } from "../components/ui/PageHeader";
import { PageInfoBanner } from "../components/ui/InfoStatCard";
import { Select } from "../components/ui/Select";
import {
  FREIGHT_TYPES,
  QUARTERS,
  STATES,
  getCitiesForState,
} from "../constants/simulator";
import { useAbortableAsync } from "../hooks/useAbortableAsync";
import { useAuth } from "../hooks/useAuth";
import { useSimulation } from "../hooks/useSimulation";
import {
  fetchSimulationOrderBundle,
  persistApprovedSimulation,
  savePendingSimulation,
  searchClients,
} from "../services/simulationOrderService";
import { notifyGestoresSimulationPending } from "../services/notificationService";
import {
  fetchCatalogoSimulador,
  fetchFreteValor,
  getFallbackCatalog,
} from "../services/produtoCatalogoService";
import { formatBRL } from "../utils/money";
import { displayCpfCnpj, validateCpfCnpj } from "../utils/dataFormatters";

export function Simulador() {
  const [searchParams] = useSearchParams();
  const simulationId = searchParams.get("simulationId");
  const { role } = useAuth();
  const [catalog, setCatalog] = useState(getFallbackCatalog());
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSource, setCatalogSource] = useState("fallback");
  const [freteUnitario, setFreteUnitario] = useState(0);
  const sim = useSimulation({ role, catalog, freteUnitario });
  const navigate = useNavigate();
  const { showAlert } = useAlertDialog();

  function ensureValidClientDocument() {
    const validation = validateCpfCnpj(sim.clientCnpjCpf, { required: true });
    if (!validation.ok) {
      showAlert({
        title: "CPF / CNPJ inválido",
        message: validation.message,
      });
      return false;
    }
    return true;
  }
  const [persisting, setPersisting] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [persistError, setPersistError] = useState(null);
  const [notifyError, setNotifyError] = useState(null);
  const [launchError, setLaunchError] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [convertAfterClientSave, setConvertAfterClientSave] = useState(false);

  const loadCatalog = useCallback(async (quarter, estado, isActive) => {
    setCatalogLoading(true);
    const res = await fetchCatalogoSimulador({
      quarter: quarter || undefined,
      estado: estado || undefined,
    });
    if (isActive && !isActive()) return;
    setCatalogLoading(false);

    if (res.ok && res.rows.length > 0) {
      setCatalog(res.rows);
      setCatalogSource("oficial");
    } else {
      setCatalog(getFallbackCatalog());
      setCatalogSource("fallback");
    }
  }, []);

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadCatalog(sim.quarter, sim.estado, isActive);
    },
    [sim.quarter, sim.estado, loadCatalog],
  );

  useAbortableAsync(
    async (_signal, isActive) => {
      if (sim.tipoFrete === "FOB" || !sim.origemFrete || !sim.destinoFrete) {
        if (isActive && !isActive()) return;
        setFreteUnitario(0);
        return;
      }
      const res = await fetchFreteValor(sim.origemFrete, sim.destinoFrete);
      if (isActive && !isActive()) return;
      setFreteUnitario(res.ok ? res.valor : 0);
    },
    [sim.tipoFrete, sim.origemFrete, sim.destinoFrete],
  );

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!simulationId) {
        sim.resetLocal();
        return;
      }
      const result = await fetchSimulationOrderBundle(simulationId);
      if (!isActive()) return;
      if (!result.ok) {
        navigate("/simulacoes", { replace: true });
        return;
      }
      sim.hydrateFromBundle(result.data);
    },
    [simulationId, navigate, sim.hydrateFromBundle, sim.resetLocal],
  );

  const handleClientSearch = useCallback(async (query, signal) => {
    const r = await searchClients(query, signal);
    if (!r.ok) return [];
    return r.rows.map((c) => ({
      id: c.id,
      label: c.nome,
      sublabel: [displayCpfCnpj(c.cnpj_cpf), c.municipio, c.uf].filter(Boolean).join(" • "),
      payload: c,
    }));
  }, []);

  const openClientRegistration = useCallback(() => {
    if (sim.isReadOnly) return;
    if (!sim.clientName.trim()) {
      setLaunchError("Informe o nome do cliente antes de cadastrar.");
      return;
    }
    setLaunchError(null);
    setClientModalOpen(true);
  }, [sim.clientName, sim.isReadOnly]);

  async function persistAndNavigate(overrideClientId) {
    setPersisting(true);
    try {
      const result = await persistApprovedSimulation({
        clientId: overrideClientId ?? sim.clientId,
        clientName: sim.clientName,
        clientCnpjCpf: sim.clientCnpjCpf,
        estado: sim.estado,
        tipoFrete: sim.tipoFrete,
        origemFrete: sim.origemFrete,
        destinoFrete: sim.destinoFrete,
        dataPagamento: sim.dataPagamento || null,
        quarter: sim.quarter,
        lines: sim.lines.map((l) => ({
          productId: l.productId,
          volume: l.volume,
          precoUnitario: l.precoUnitario,
          proposta: l.proposta,
          cultura: l.cultura,
        })),
        totalValor: sim.totalValor,
        totalProposta: sim.totalProposta,
      });
      if (!result.ok) {
        setPersistError(result.error);
        return;
      }
      navigate(`/pedido/${result.simulationId}`);
    } finally {
      setPersisting(false);
    }
  }

  async function handleConvertToPedido() {
    setPersistError(null);
    setLaunchError(null);
    const blockReason = sim.getLaunchBlockReason();
    if (blockReason) {
      setLaunchError(blockReason);
      return;
    }
    if (!sim.canConvert) return;

    if (!sim.clientId) {
      if (!sim.clientName.trim() || !sim.clientCnpjCpf.trim()) {
        setLaunchError("Informe nome e CPF/CNPJ do cliente.");
        return;
      }
      if (!ensureValidClientDocument()) return;
      setConvertAfterClientSave(true);
      setClientModalOpen(true);
      return;
    }

    if (!ensureValidClientDocument()) return;

    await persistAndNavigate();
  }

  function buildSimulationPayload() {
    return {
      simulationId,
      clientId: sim.clientId,
      clientName: sim.clientName,
      clientCnpjCpf: sim.clientCnpjCpf,
      estado: sim.estado,
      tipoFrete: sim.tipoFrete,
      origemFrete: sim.origemFrete,
      destinoFrete: sim.destinoFrete,
      dataPagamento: sim.dataPagamento || null,
      quarter: sim.quarter,
      lines: sim.lines.map((l) => ({
        productId: l.productId,
        volume: l.volume,
        precoUnitario: l.precoUnitario,
        proposta: l.proposta,
        cultura: l.cultura,
      })),
      totalValor: sim.totalValor,
      totalProposta: sim.totalProposta,
    };
  }

  async function handleNotifyGestor() {
    setNotifyError(null);
    setLaunchError(null);

    if (
      sim.isGestor ||
      sim.remotePendingLock ||
      sim.globalStatus !== "Pendente"
    ) {
      return;
    }

    if (!sim.clientName.trim() || !sim.clientCnpjCpf.trim()) {
      setNotifyError(
        "Informe nome e CPF/CNPJ do cliente antes de notificar o gestor.",
      );
      return;
    }

    if (!ensureValidClientDocument()) return;

    setNotifying(true);
    try {
      const saveResult = await savePendingSimulation(buildSimulationPayload());
      if (!saveResult.ok) {
        setNotifyError(saveResult.error);
        return;
      }

      const notifyResult = await notifyGestoresSimulationPending({
        simulationId: saveResult.simulationId,
        title: `Aprovação solicitada — ${sim.clientName.trim()}`,
        body: `Proposta de ${formatBRL(sim.totalProposta)} abaixo de 97% do valor bruto.`,
      });

      if (!notifyResult.ok) {
        setNotifyError(notifyResult.error);
        return;
      }

      sim.lockAsPending();
      sim.showActionBanner(
        "Solicitação enviada: o gestor será notificado sobre esta simulação pendente de aprovação.",
      );

      if (!simulationId) {
        navigate(
          `/simulador?simulationId=${encodeURIComponent(saveResult.simulationId)}`,
          { replace: true },
        );
      }
    } finally {
      setNotifying(false);
    }
  }

  const cityOptions = getCitiesForState(sim.estado).map((c) => ({
    id: c,
    label: c,
  }));

  const productsForSelect = sim.catalog.map((p) => ({
    id: p.id,
    nome: p.displayNome ?? p.nome,
  }));

  const pageTitle = simulationId ? "Editar simulação" : "Nova simulação";
  const pageDescription = simulationId
    ? "Revise os dados, ajuste produtos e finalize a proposta comercial."
    : "Monte a proposta comercial informando cliente, frete e produtos.";

  const showReadOnlyNotice = sim.isReadOnly;

  const heroContext = sim.clientName.trim()
    ? `Proposta para ${sim.clientName.trim()} — ${sim.lines.length} produto(s) · ${formatBRL(sim.totalProposta)}`
    : sim.lines.length > 0
      ? `${sim.lines.length} produto(s) na simulação · proposta de ${formatBRL(sim.totalProposta)}`
      : "Preencha cliente, frete e produtos para montar a proposta.";

  const clientModalInitial = useMemo(
    () => ({
      nome: sim.clientName,
      cnpj_cpf: sim.clientCnpjCpf,
      uf: sim.estado ?? "",
    }),
    [sim.clientName, sim.clientCnpjCpf, sim.estado],
  );

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <PageBackLink to="/simulacoes">Voltar para simulações</PageBackLink>

      <div className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50/80 via-white to-violet-50/40 p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary-200/30 blur-3xl sm:-right-10 sm:-top-10 sm:size-40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 size-24 rounded-full bg-violet-200/20 blur-3xl sm:-bottom-8 sm:left-1/3 sm:size-32"
          aria-hidden
        />

        <PageHeader
          eyebrow="Simulação comercial"
          title={pageTitle}
          description={pageDescription}
          className="relative mb-0"
        />

        <PageInfoBanner icon={IconClipboardList}>
          {heroContext}
          {catalogLoading
            ? ' · Atualizando catálogo de produtos…'
            : catalogSource === 'fallback'
              ? ' · Catálogo de demonstração (lance produtos em Lançamento de Produtos).'
              : sim.quarter
                ? ` · ${catalog.length} produto(s) do quarter ${sim.quarter}.`
                : ` · ${catalog.length} produto(s) no catálogo oficial.`}
        </PageInfoBanner>
      </div>

      {sim.actionBanner ? (
        <AlertMessage tone="info" role="status">
          <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{sim.actionBanner}</span>
            <Button
              type="button"
              variant="secondary"
              className="h-9 shrink-0 px-4"
              onClick={sim.dismissActionBanner}
            >
              Fechar
            </Button>
          </span>
        </AlertMessage>
      ) : null}

      <SimuladorSummaryBar
        lineCount={sim.lines.length}
        totalValor={sim.totalValor}
        totalProposta={sim.totalProposta}
        globalStatus={sim.globalStatus}
      />

      <div className="flex flex-col gap-4 sm:gap-6">
        <SimuladorSectionPanel
          icon={SIMULADOR_SECTION_ICONS.cliente}
          title="Cliente"
          description="Identifique o cliente e o estado da operação."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Estado"
              placeholder="Selecione…"
              value={sim.estado ?? ""}
              onChange={(e) => sim.setEstado(e.target.value)}
              options={STATES}
              disabled={sim.isReadOnly}
            />
            <Combobox
              label="Cliente"
              placeholder="Buscar cliente…"
              value={sim.clientName}
              onTextChange={sim.setClientName}
              onSearch={handleClientSearch}
              onSelect={(opt) => sim.selectClient(opt.payload)}
              onCreateRequest={openClientRegistration}
              disabled={sim.isReadOnly}
              className=""
            />
            <FormattedInput
              format="cpfCnpj"
              label="CPF / CNPJ"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={sim.clientCnpjCpf}
              onChange={(e) => sim.setClientCnpjCpf(e.target.value)}
              disabled={sim.isReadOnly}
            />
          </div>
        </SimuladorSectionPanel>

        <SimuladorSectionPanel
          icon={SIMULADOR_SECTION_ICONS.frete}
          title="Frete e logística"
          description="Defina pagamento, tipo de frete e rotas quando aplicável."
          gradient="from-primary-50/70 via-white to-sky-50/50"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Data de pagamento"
              type="date"
              value={sim.dataPagamento}
              onChange={(e) => sim.setDataPagamento(e.target.value)}
              disabled={sim.isReadOnly}
            />
            <Select
              label="Tipo de frete"
              placeholder="Selecione…"
              value={sim.tipoFrete ?? ""}
              onChange={(e) => sim.setTipoFrete(e.target.value)}
              options={FREIGHT_TYPES}
              disabled={sim.isReadOnly}
            />
            <Select
              label="Quarter"
              placeholder="Selecione…"
              value={sim.quarter ?? ""}
              onChange={(e) => sim.setQuarter(e.target.value)}
              options={QUARTERS}
              disabled={sim.isReadOnly}
            />
            {sim.showFreteRotas ? (
              <>
                <Combobox
                  label="Origem do frete"
                  placeholder={
                    sim.estado
                      ? "Cidade de saída…"
                      : "Selecione um estado primeiro"
                  }
                  value={sim.origemFrete}
                  onTextChange={sim.setOrigemFrete}
                  onSelect={(opt) => sim.setOrigemFrete(opt.label)}
                  options={cityOptions}
                  disabled={sim.isReadOnly || !sim.estado}
                />
                <Combobox
                  label="Destino do frete"
                  placeholder={
                    sim.estado
                      ? "Cidade de destino…"
                      : "Selecione um estado primeiro"
                  }
                  value={sim.destinoFrete}
                  onTextChange={sim.setDestinoFrete}
                  onSelect={(opt) => sim.setDestinoFrete(opt.label)}
                  options={cityOptions}
                  disabled={sim.isReadOnly || !sim.estado}
                />
              </>
            ) : null}
          </div>
        </SimuladorSectionPanel>

        <SimuladorSectionPanel
          icon={SIMULADOR_SECTION_ICONS.produtos}
          title="Produtos"
          description="Adicione cultura (simulação), produtos e propostas por linha."
          gradient="from-primary-50/70 via-white to-violet-50/40"
          actions={
            <Button
              type="button"
              variant="secondary"
              className="h-9 w-full px-3 sm:w-auto"
              onClick={sim.addLine}
              disabled={sim.isReadOnly}
            >
              Adicionar produto
            </Button>
          }
        >
          {sim.lines.length === 0 ? (
            <EmptyState title="Nenhum produto na simulação" />
          ) : (
            <>
              <div className="grid gap-3 lg:hidden">
                {sim.lines.map((row) => (
                  <SimulationLineCard
                    key={row.id}
                    row={row}
                    cultureOptions={sim.cultureOptions}
                    productOptions={productsForSelect}
                    isReadOnly={sim.isReadOnly}
                    canOverrideFloor={sim.canOverrideFloor}
                    onVolumeChange={(v) => sim.setLineVolume(row.id, v)}
                    onCulturaChange={(c) => sim.setLineCultura(row.id, c)}
                    onProductChange={(id) => sim.setLineProduct(row.id, id)}
                    onPropostaChange={(p) => sim.setLineProposta(row.id, p)}
                    onRemove={() => sim.removeLine(row.id)}
                  />
                ))}
              </div>
              <SimulationLinesTable
                lines={sim.lines}
                cultureOptions={sim.cultureOptions}
                productOptions={productsForSelect}
                isReadOnly={sim.isReadOnly}
                canOverrideFloor={sim.canOverrideFloor}
                onVolumeChange={sim.setLineVolume}
                onCulturaChange={sim.setLineCultura}
                onProductChange={sim.setLineProduct}
                onPropostaChange={sim.setLineProposta}
                onRemove={sim.removeLine}
              />
            </>
          )}
        </SimuladorSectionPanel>

        <SimuladorSectionPanel
          icon={SIMULADOR_SECTION_ICONS.consolidacao}
          title="Consolidação"
          description="Revise totais, status e finalize a simulação."
          gradient="from-primary-50/70 via-white to-emerald-50/40"
        >
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Soma valor total
              </dt>
              <dd className="finance-text mt-1 text-xl font-semibold text-slate-900">
                {formatBRL(sim.totalValor)}
              </dd>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Soma total proposta
              </dt>
              <dd className="finance-text mt-1 text-xl font-semibold text-slate-900">
                {formatBRL(sim.totalProposta)}
              </dd>
            </div>
            <div
              className={[
                "relative overflow-hidden rounded-2xl border px-4 py-3.5",
                sim.globalStatus === "Aprovado"
                  ? "border-emerald-200/80 bg-emerald-50 ring-1 ring-emerald-100"
                  : sim.globalStatus === "Pendente"
                    ? "border-amber-200/80 bg-amber-50 ring-1 ring-amber-100"
                    : "border-slate-200/80 bg-slate-50/80",
              ].join(" ")}
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Status geral
              </dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                {sim.globalStatus}
              </dd>
            </div>
          </dl>

          <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            {showReadOnlyNotice ? (
              <p className="text-sm text-slate-600">
                Proposta enviada — aguardando decisão do gestor.
              </p>
            ) : null}
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              {!sim.isReadOnly &&
              !sim.isGestor &&
              sim.globalStatus === "Pendente" ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:flex-1"
                  loading={notifying}
                  onClick={() => void handleNotifyGestor()}
                >
                  Notificar gestor
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                className="w-full sm:flex-1"
                loading={persisting}
                onClick={() => void handleConvertToPedido()}
              >
                Converter em pedido
              </Button>
            </div>
          </div>

          {launchError ? (
            <AlertMessage className="mt-4">{launchError}</AlertMessage>
          ) : null}
          {notifyError ? (
            <AlertMessage className="mt-4">{notifyError}</AlertMessage>
          ) : null}
          {persistError ? (
            <AlertMessage className="mt-4">{persistError}</AlertMessage>
          ) : null}
        </SimuladorSectionPanel>
      </div>

      <ModalClienteForm
        open={clientModalOpen}
        initial={clientModalInitial}
        onClose={() => {
          setClientModalOpen(false);
          setConvertAfterClientSave(false);
        }}
        onSaved={(client) => {
          sim.selectClient(client);
          if (convertAfterClientSave) {
            setConvertAfterClientSave(false);
            void persistAndNavigate(client.id);
          }
        }}
      />
    </div>
  );
}
