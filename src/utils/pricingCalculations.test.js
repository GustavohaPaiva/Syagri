import { describe, expect, it } from 'vitest'
import {
  calcDiasAntecipacao,
  calcFatorAntecipacao,
  calcPrecoSimulacao,
} from './pricingCalculations'

describe('pricingCalculations', () => {
  it('calcula dias entre pagamento e vencimento da lista', () => {
    expect(calcDiasAntecipacao('2026-03-01', '2026-03-15')).toBe(-14)
    expect(calcDiasAntecipacao('2026-03-20', '2026-03-15')).toBe(5)
  })

  it('aplica antecipação quando pagamento é antes do vencimento da lista', () => {
    const result = calcPrecoSimulacao({
      custoIcms: 1000,
      freteUnitario: 50,
      diasAntecipacao: -30,
    })
    expect(result.base).toBe(1050)
    expect(result.fator).toBeCloseTo(calcFatorAntecipacao(30), 4)
    expect(result.precoFinal).toBeGreaterThan(0)
  })

  it('aplica margem de 15% no preço final', () => {
    const result = calcPrecoSimulacao({
      custoIcms: 850,
      freteUnitario: 0,
      diasAntecipacao: 0,
    })
    expect(result.financeiro).toBe(850)
    expect(result.precoFinal).toBeCloseTo(850 / 0.85, 2)
  })
})
