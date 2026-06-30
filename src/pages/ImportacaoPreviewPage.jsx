import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SpreadsheetPreviewPanel } from "../components/importacao/SpreadsheetPreviewPanel";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { ButtonGroup } from "../components/ui/ButtonGroup";
import { Input } from "../components/ui/Input";
import { PageBackLink } from "../components/ui/PageBackLink";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import {
  IGNORE_COLUMN_VALUE,
  MAPPING_TARGET_LABELS,
  SYSTEM_MAPPING_FIELDS,
} from "../constants/mapeamentoCampos";
import { useSyncPageLoading } from "../contexts/PageLoadingContext";
import { useAbortableAsync } from "../hooks/useAbortableAsync";
import {
  lookupOrCreateFornecedor,
  processLoteAuto,
} from "../services/produtoImportacaoService";
import { filterDataRows, findEmbalagemColumnIndex } from "../utils/spreadsheetAnalyzer";
import { parseSpreadsheetFile } from "../utils/spreadsheetParser";

const CONFIDENCE_LABEL = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  none: "Não detectado",
};

function mappingsToRecord(mappings) {
  const record = {};
  for (const m of mappings ?? []) {
    record[`col-${m.sourceIndex}`] = m.target;
  }
  return record;
}

function recordToMappings(columns, record) {
  return columns.map((col) => ({
    sourceIndex: col.index,
    sourceLabel: col.label,
    target: record[col.id] || IGNORE_COLUMN_VALUE,
  }));
}

export function ImportacaoPreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file ?? null;

  const [error, setError] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [parseState, setParseState] = useState(null);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [dataValidade, setDataValidade] = useState("");
  const [quarterCalculado, setQuarterCalculado] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [columnMapRecord, setColumnMapRecord] = useState({});
  const [mapConfidence, setMapConfidence] = useState({});
  const [loading, setLoading] = useState(Boolean(file));
  const [confirming, setConfirming] = useState(false);

  useSyncPageLoading(loading);

  useAbortableAsync(
    async (_signal, isActive) => {
      if (!file) return;
      setLoading(true);
      setError(null);
      setParseState(null);

      const result = await parseSpreadsheetFile(file);
      if (!isActive()) return;

      if (!result.ok) {
        setLoading(false);
        setError(result.error);
        return;
      }

      setHeaderRowIndex(result.headerRowIndex);
      setDataValidade(result.dataValidade ?? "");
      setQuarterCalculado(result.quarterCalculado ?? "");
      setFornecedorNome(result.fornecedorDetectado?.fornecedorNome ?? "");
      setColumnMapRecord(mappingsToRecord(result.autoMappings));
      setMapConfidence(result.autoMapConfidence ?? {});
      setParseState(result);
      setLoading(false);
      setProcessError(null);
    },
    [file],
    Boolean(file),
  );

  const columnMappings = useMemo(() => {
    if (!parseState?.columns) return [];
    return recordToMappings(parseState.columns, columnMapRecord);
  }, [parseState, columnMapRecord]);

  const mappingValidation = useMemo(() => {
    const targets = columnMappings
      .map((m) => m.target)
      .filter((t) => t && t !== IGNORE_COLUMN_VALUE);
    const missingRequired = ["produto", "preco_custo"].filter(
      (t) => !targets.includes(t),
    );
    const duplicates = Object.entries(
      targets.reduce((acc, t) => {
        acc[t] = (acc[t] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .filter(([, count]) => count > 1)
      .map(([t]) => t);
    return { missingRequired, duplicates };
  }, [columnMappings]);

  const lowConfidenceFields = useMemo(
    () =>
      Object.entries(mapConfidence)
        .filter(([, c]) => c === "low" || c === "none")
        .map(([field]) => MAPPING_TARGET_LABELS[field] ?? field),
    [mapConfidence],
  );

  function handleColumnMapChange(colId, target) {
    setColumnMapRecord((prev) => ({ ...prev, [colId]: target }));
  }

  const previewRows = useMemo(() => {
    if (!parseState?.matrix?.length) return [];
    return filterDataRows(parseState.matrix, headerRowIndex, {
      produtoIndex: columnMappings.find((m) => m.target === "produto")
        ?.sourceIndex,
      precoIndex: columnMappings.find((m) => m.target === "preco_custo")
        ?.sourceIndex,
      referenciaIndex: columnMappings.find(
        (m) => m.target === "referencia_complementar",
      )?.sourceIndex,
      embalagemIndex: findEmbalagemColumnIndex(
        parseState.matrix,
        headerRowIndex,
      ),
    });
  }, [parseState, headerRowIndex, columnMappings]);

  async function handleConfirm() {
    if (!file) {
      setProcessError("Sessão de importação inválida.");
      return;
    }
    if (!fornecedorNome.trim()) {
      setProcessError("Informe o fornecedor detectado na planilha.");
      return;
    }
    if (!quarterCalculado.trim()) {
      setProcessError("Informe o quarter (revise a data de validade).");
      return;
    }
    if (mappingValidation.missingRequired.length > 0) {
      const labels = mappingValidation.missingRequired.map(
        (t) => MAPPING_TARGET_LABELS[t] ?? t,
      );
      setProcessError(`Mapeie os campos obrigatórios: ${labels.join(", ")}.`);
      return;
    }
    if (mappingValidation.duplicates.length > 0) {
      setProcessError(
        "Cada campo do sistema só pode ser usado uma vez (exceto “Ignorar coluna”).",
      );
      return;
    }

    setProcessError(null);
    setConfirming(true);

    const parseOptions = {
      fornecedorNome: fornecedorNome.trim(),
      headerRowIndex,
      dataValidade,
      quarterCalculado,
      columnMappings,
      autoMapConfidence: mapConfidence,
      metadataPlanilha: parseState?.metadataPlanilha ?? {},
    };

    const fornRes = await lookupOrCreateFornecedor(parseOptions.fornecedorNome);
    if (!fornRes.ok) {
      setConfirming(false);
      setProcessError(fornRes.error);
      return;
    }

    const res = await processLoteAuto({
      fornecedorId: fornRes.row.id,
      columnMappings: parseOptions.columnMappings,
      file,
      parseOptions,
    });
    setConfirming(false);

    if (!res.ok) {
      setProcessError(res.error);
      return;
    }

    navigate(`/admin/importacao/lote/${res.loteId}`);
  }

  if (!file) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <PageBackLink to="/admin/importacao">Voltar ao lançamento</PageBackLink>
        <AlertMessage>
          Nenhuma planilha selecionada. Envie um arquivo na tela de lançamento.
        </AlertMessage>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <PageBackLink to="/admin/importacao">Voltar ao lançamento</PageBackLink>

      <PageHeader
        eyebrow="Revisão"
        title="Revisar importação"
        description={file.name}
        actions={
          <ButtonGroup>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/admin/importacao")}
              disabled={confirming}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={confirming}
              disabled={loading || !parseState}
              onClick={() => void handleConfirm()}
            >
              Processar lote
            </Button>
          </ButtonGroup>
        }
      />

      {loading ? (
        <p className="text-sm text-slate-600">Analisando planilha…</p>
      ) : error ? (
        <AlertMessage>{error}</AlertMessage>
      ) : parseState ? (
        <>
          {processError ? <AlertMessage>{processError}</AlertMessage> : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <Input
              label="Fornecedor detectado"
              value={fornecedorNome}
              onChange={(e) => setFornecedorNome(e.target.value)}
              placeholder="Ex.: YARA"
            />
            {parseState.fornecedorDetectado?.confidence ? (
              <p className="mt-1 text-xs text-slate-500">
                Confiança da detecção:{" "}
                {CONFIDENCE_LABEL[parseState.fornecedorDetectado.confidence] ??
                  parseState.fornecedorDetectado.confidence}
              </p>
            ) : null}
          </div>

          <SpreadsheetPreviewPanel
            dataValidade={dataValidade}
            onDataValidadeChange={setDataValidade}
            quarterCalculado={quarterCalculado}
            onQuarterChange={setQuarterCalculado}
            previewRows={previewRows}
          />

          {lowConfidenceFields.length > 0 ? (
            <AlertMessage tone="info">
              Revise o mapeamento das colunas com baixa confiança:{" "}
              {lowConfidenceFields.join(", ")}.
            </AlertMessage>
          ) : null}

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Mapeamento automático das colunas
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {previewRows.length} linha(s) serão importadas (somente
                embalagem 1000KG, quando a coluna existir na planilha).
              </p>
            </div>

            {parseState.columns.map((col) => {
              const selected = columnMapRecord[col.id] ?? "";
              const targetLabel =
                selected && selected !== IGNORE_COLUMN_VALUE
                  ? MAPPING_TARGET_LABELS[selected]
                  : null;
              const confidenceForCol =
                selected && selected !== IGNORE_COLUMN_VALUE
                  ? mapConfidence[selected]
                  : null;

              return (
                <div
                  key={col.id}
                  className="grid gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:grid-cols-2 sm:items-center"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-slate-900">
                      {col.label}
                    </p>
                    {targetLabel && confidenceForCol ? (
                      <p className="text-xs text-slate-500">
                        {targetLabel} · confiança{" "}
                        {CONFIDENCE_LABEL[confidenceForCol] ?? confidenceForCol}
                      </p>
                    ) : null}
                  </div>
                  <Select
                    aria-label={`Mapear coluna ${col.label}`}
                    placeholder="Selecione o campo…"
                    value={selected}
                    onChange={(e) =>
                      handleColumnMapChange(col.id, e.target.value)
                    }
                    options={SYSTEM_MAPPING_FIELDS}
                  />
                </div>
              );
            })}
          </section>

          <div className="sticky bottom-0 -mx-4 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-sm sm:-mx-0 sm:rounded-2xl sm:border sm:px-6">
            <ButtonGroup>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/importacao")}
                disabled={confirming}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                loading={confirming}
                disabled={loading || !parseState}
                onClick={() => void handleConfirm()}
              >
                Processar lote
              </Button>
            </ButtonGroup>
          </div>
        </>
      ) : null}
    </div>
  );
}
