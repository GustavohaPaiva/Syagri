import { memo } from "react";
import { EditableNumber } from "../ui/EditableNumber";
import { Select } from "../ui/Select";
import { RemoveLineButton } from "./RemoveLineButton";
import { formatBRL } from "../../utils/money";

function LineStatusBadge({ row, canOverrideFloor }) {
  if (row.isLineBelowFloor && !canOverrideFloor) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        &lt; 97%
      </span>
    );
  }
  if (row.isLineBelowFloor && canOverrideFloor) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        Especial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
      OK
    </span>
  );
}

export const SimulationLineCard = memo(function SimulationLineCard({
  row,
  cultureOptions,
  productOptions,
  isReadOnly,
  canOverrideFloor,
  onVolumeChange,
  onCulturaChange,
  onProductChange,
  onPropostaChange,
  onRemove,
}) {
  const selectClass = "h-9 text-xs";

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-3 shadow-sm transition-colors",
        row.isLineBelowFloor && !canOverrideFloor
          ? "border-amber-200/90 bg-amber-50/20"
          : "border-slate-200/90",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Vol.
          </span>
          <EditableNumber
            value={row.volume}
            onChange={onVolumeChange}
            disabled={isReadOnly}
            ariaLabel="Volume da linha"
            className="text-sm"
          />
        </div>
        <div className="min-w-0 text-right">
          <p className="finance-text text-sm font-semibold text-slate-900">
            {formatBRL(row.valorTotal)}
          </p>
          <p className="finance-text text-[11px] text-slate-500">
            {formatBRL(row.propostaTotal)}
          </p>
        </div>
        <RemoveLineButton onClick={onRemove} disabled={isReadOnly} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2">
        <Select
          label="Cultura"
          value={row.cultura ?? ""}
          onChange={(e) => onCulturaChange(e.target.value)}
          options={cultureOptions.map((c) => ({ value: c, label: c }))}
          disabled={isReadOnly}
          className={selectClass}
        />
        <Select
          label="Produto"
          value={row.productId}
          onChange={(e) => onProductChange(e.target.value)}
          options={productOptions.map((p) => ({ value: p.id, label: p.nome }))}
          disabled={isReadOnly}
          className={selectClass}
        />
        <div className="col-span-2 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[11px] font-medium text-slate-600">
              Proposta un.
            </label>
            <EditableNumber
              value={row.proposta}
              onChange={onPropostaChange}
              disabled={isReadOnly}
              min={0}
              step={0.01}
              decimals={2}
              ariaLabel="Proposta unitária"
              className="text-sm"
            />
          </div>
          <LineStatusBadge row={row} canOverrideFloor={canOverrideFloor} />
        </div>
      </div>

      <p className="finance-text mt-1.5 text-[11px] text-slate-500">
        Tabela {formatBRL(row.precoUnitario)}
      </p>
    </article>
  );
});
