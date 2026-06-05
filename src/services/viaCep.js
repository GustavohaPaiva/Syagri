import { isViaCepError } from '../types/viacep';
/** Apenas dígitos, máximo 8 */
export function normalizeCepDigits(raw) {
    return raw.replace(/\D/g, '').slice(0, 8);
}
export async function fetchViaCepAddress(cepDigits) {
    if (cepDigits.length !== 8) {
        return { ok: false, error: 'CEP deve conter 8 dígitos.' };
    }
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
        return { ok: false, error: 'Falha ao consultar o ViaCEP. Tente novamente.' };
    }
    const body = await res.json();
    if (!body || typeof body !== 'object') {
        return { ok: false, error: 'Resposta inválida do ViaCEP.' };
    }
    const data = body;
    if (isViaCepError(data)) {
        return { ok: false, error: 'CEP não encontrado.' };
    }
    return {
        ok: true,
        data: {
            logradouro: data.logradouro ?? '',
            bairro: data.bairro ?? '',
            municipio: data.localidade ?? '',
            uf: data.uf ?? '',
        },
    };
}
