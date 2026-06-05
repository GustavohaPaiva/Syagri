/** Formata valor monetário (pt-BR) — use junto com a classe `.finance-text` na UI */
export function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
