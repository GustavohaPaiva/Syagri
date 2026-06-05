import { EditableNumber } from '../ui/EditableNumber'
import { RemoveLineButton } from './RemoveLineButton'
import { formatBRL } from '../../utils/money'

export function SimulationLinesTable({
  lines,
  cultureOptions,
  productsByCulture,
  isReadOnly,
  canOverrideFloor,
  onVolumeChange,
  onCulturaChange,
  onProductChange,
  onPropostaChange,
  onRemove,
}) {
  const cell = 'px-3 py-2.5 text-center align-middle'
  const selectClass =
    'mx-auto h-9 w-full max-w-[10rem] rounded-xl border border-gray-200 bg-white px-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50'

  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 lg:block">
      <table className="min-w-full border-collapse text-center text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <th className={cell}>Volume</th>
            <th className={cell}>Cultura</th>
            <th className={cell}>Produto</th>
            <th className={cell}>Valor unit.</th>
            <th className={cell}>Valor total</th>
            <th className={cell}>Proposta unit.</th>
            <th className={cell}>Proposta total</th>
            <th className={cell}>Status</th>
            <th className={`${cell} w-14`} />
          </tr>
        </thead>
        <tbody>
          {lines.map((row) => (
            <tr
              key={row.id}
              className={[
                'border-b border-slate-100 transition-colors',
                row.isLineBelowFloor && !canOverrideFloor
                  ? 'bg-amber-50/50'
                  : 'bg-white hover:bg-slate-50/80',
              ].join(' ')}
            >
              <td className={cell}>
                <EditableNumber
                  value={row.volume}
                  onChange={(v) => onVolumeChange(row.id, v)}
                  disabled={isReadOnly}
                  ariaLabel="Volume da linha"
                  className="text-sm"
                  centered
                />
              </td>
              <td className={cell}>
                <select
                  aria-label="Cultura da linha"
                  className={selectClass}
                  value={row.cultura ?? ''}
                  onChange={(e) => onCulturaChange(row.id, e.target.value)}
                  disabled={isReadOnly}
                >
                  {cultureOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </td>
              <td className={cell}>
                <select
                  aria-label="Produto da linha"
                  className={`${selectClass} max-w-[12rem]`}
                  value={row.productId}
                  onChange={(e) => onProductChange(row.id, e.target.value)}
                  disabled={isReadOnly}
                >
                  {productsByCulture(row.cultura).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </td>
              <td className={`finance-text ${cell} font-medium text-slate-800`}>
                {formatBRL(row.precoUnitario)}
              </td>
              <td className={`finance-text ${cell} font-medium text-slate-900`}>
                {formatBRL(row.valorTotal)}
              </td>
              <td className={cell}>
                <EditableNumber
                  value={row.proposta}
                  onChange={(p) => onPropostaChange(row.id, p)}
                  disabled={isReadOnly}
                  min={0}
                  step={0.01}
                  decimals={2}
                  ariaLabel="Proposta unitária"
                  className="text-sm"
                  centered
                />
              </td>
              <td className={`finance-text ${cell} font-medium text-slate-900`}>
                {formatBRL(row.propostaTotal)}
              </td>
              <td className={cell}>
                {row.isLineBelowFloor && !canOverrideFloor ? (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    &lt; 97%
                  </span>
                ) : row.isLineBelowFloor && canOverrideFloor ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    Especial
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    OK
                  </span>
                )}
              </td>
              <td className={cell}>
                <RemoveLineButton
                  onClick={() => onRemove(row.id)}
                  disabled={isReadOnly}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
