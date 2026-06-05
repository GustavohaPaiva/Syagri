import { roundMoney } from '../utils/roundMoney';
import { supabase } from './supabase';
function parseBundle(data) {
    if (!data || typeof data !== 'object')
        return null;
    const row = data;
    const rawClient = row.clients;
    const clientRow = Array.isArray(rawClient) ? rawClient[0] : rawClient;
    const rawItems = row.simulation_items;
    if (!clientRow || typeof clientRow !== 'object' || !Array.isArray(rawItems)) {
        return null;
    }
    const client = clientRow;
    const items = rawItems.map((it) => {
        const item = it;
        const rawProd = item.products;
        const prodRow = Array.isArray(rawProd) ? rawProd[0] : rawProd;
        const prod = prodRow && typeof prodRow === 'object'
            ? prodRow
            : null;
        return {
            id: String(item.id),
            product_id: String(item.product_id ?? ''),
            volume: Number(item.volume),
            preco_unitario: Number(item.preco_unitario),
            proposta: Number(item.proposta),
            product: prod
                ? { nome: String(prod.nome ?? ''), cultura: String(prod.cultura ?? '') }
                : null,
        };
    });
    return {
        simulation: {
            id: String(row.id),
            user_id: String(row.user_id),
            client_id: String(row.client_id),
            total_bruto: Number(row.total_bruto),
            total_proposta: Number(row.total_proposta),
            status: row.status,
            tipo_frete: row.tipo_frete != null ? String(row.tipo_frete) : null,
            origem_frete: row.origem_frete != null ? String(row.origem_frete) : null,
            destino_frete: row.destino_frete != null ? String(row.destino_frete) : null,
            data_pagamento: row.data_pagamento != null ? String(row.data_pagamento) : null,
            quarter: row.quarter != null ? String(row.quarter) : null,
            created_at: String(row.created_at),
            updated_at: String(row.updated_at),
        },
        client,
        items,
    };
}
export async function fetchSimulationOrderBundle(simulationId) {
    const { data, error } = await supabase
        .from('simulations')
        .select(`
      id,
      user_id,
      client_id,
      total_bruto,
      total_proposta,
      status,
      tipo_frete,
      origem_frete,
      destino_frete,
      data_pagamento,
      quarter,
      created_at,
      updated_at,
      clients (
        id,
        nome,
        razao_social,
        cnpj_cpf,
        email,
        telefone,
        endereco,
        cep,
        logradouro,
        bairro,
        municipio,
        uf
      ),
      simulation_items (
        id,
        product_id,
        volume,
        preco_unitario,
        proposta,
        products ( nome, cultura )
      )
    `)
        .eq('id', simulationId)
        .maybeSingle();
    if (error) {
        return { ok: false, error: error.message };
    }
    if (!data) {
        return { ok: false, error: 'Simulação não encontrada.' };
    }
    const bundle = parseBundle(data);
    if (!bundle) {
        return { ok: false, error: 'Dados da simulação incompletos.' };
    }
    return { ok: true, data: bundle };
}
export async function searchClients(query, signal) {
    let q = supabase
        .from('clients')
        .select('id, nome, cnpj_cpf, uf, municipio, email, telefone')
        .order('nome', { ascending: true })
        .limit(8);
    const text = (query ?? '').trim();
    if (text) {
        q = q.ilike('nome', `%${text}%`);
    }
    const { data, error } = signal ? await q.abortSignal(signal) : await q;
    if (error) return { ok: false, error: error.message };
    return { ok: true, rows: data ?? [] };
}

export async function persistApprovedSimulation(input) {
    const { data: { session }, error: sessionError, } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        return { ok: false, error: 'Sessão expirada. Faça login novamente.' };
    }
    const nome = input.clientName.trim();
    const cnpj = input.clientCnpjCpf.trim();
    if (!nome || !cnpj) {
        return { ok: false, error: 'Informe nome e CPF/CNPJ do cliente.' };
    }
    if (input.lines.length === 0) {
        return { ok: false, error: 'Inclua ao menos um produto na simulação.' };
    }

    let clientId = input.clientId ?? null;
    if (!clientId) {
        const { data: clientRow, error: clientError } = await supabase
            .from('clients')
            .insert({
            nome,
            cnpj_cpf: cnpj,
            uf: input.estado ?? null,
        })
            .select('id')
            .single();
        if (clientError || !clientRow) {
            return {
                ok: false,
                error: clientError?.message ?? 'Não foi possível salvar o cliente.',
            };
        }
        clientId = clientRow.id;
    }
    const clientRow = { id: clientId };
    const totalBruto = roundMoney(input.totalValor);
    const totalProposta = roundMoney(input.totalProposta);
    const { data: simRow, error: simError } = await supabase
        .from('simulations')
        .insert({
        user_id: session.user.id,
        client_id: clientRow.id,
        total_bruto: totalBruto,
        total_proposta: totalProposta,
        status: 'approved',
        tipo_frete: input.tipoFrete ?? null,
        origem_frete: input.origemFrete?.trim() || null,
        destino_frete: input.destinoFrete?.trim() || null,
        data_pagamento: input.dataPagamento || null,
        quarter: input.quarter ?? null,
    })
        .select('id')
        .single();
    if (simError || !simRow) {
        return {
            ok: false,
            error: simError?.message ?? 'Não foi possível salvar a simulação.',
        };
    }
    const itemsPayload = input.lines.map((line) => ({
        simulation_id: simRow.id,
        product_id: line.productId,
        volume: line.volume,
        preco_unitario: roundMoney(line.precoUnitario),
        proposta: roundMoney(line.proposta),
        status_linha: 'approved',
    }));
    const { error: itemsError } = await supabase
        .from('simulation_items')
        .insert(itemsPayload);
    if (itemsError) {
        return {
            ok: false,
            error: itemsError.message,
        };
    }
    return { ok: true, simulationId: simRow.id };
}
export async function updateSimulationStatus(simulationId, status) {
    const { error } = await supabase
        .from('simulations')
        .update({ status })
        .eq('id', simulationId);
    if (error)
        return { ok: false, error: error.message };
    return { ok: true };
}
export async function fetchSimulationsList(params) {
    let q = supabase
        .from('simulations')
        .select(`
      id,
      created_at,
      total_proposta,
      status,
      user_id,
      clients ( nome )
    `)
        .order('created_at', { ascending: false });
    if (params.role === 'consultor') {
        q = q.eq('user_id', params.userId);
    }
    if (params.statusFilter) {
        q = q.eq('status', params.statusFilter);
    }
    const { data, error } = await q;
    if (error)
        return { ok: false, error: error.message };
    const raw = (data ?? []);
    const rows = raw.map((row) => {
        const rawClient = row.clients;
        const clientRow = Array.isArray(rawClient) ? rawClient[0] : rawClient;
        const nome = clientRow && typeof clientRow === 'object' && 'nome' in clientRow
            ? String(clientRow.nome ?? '')
            : '';
        return {
            id: String(row.id),
            created_at: String(row.created_at),
            client_nome: nome,
            total_proposta: Number(row.total_proposta),
            status: row.status,
            user_id: String(row.user_id),
        };
    });
    let consultorNomeById = {};
    if (params.role === 'gestor' && rows.length > 0) {
        const ids = [...new Set(rows.map((r) => r.user_id))];
        const { data: profs, error: pErr } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', ids);
        if (pErr)
            return { ok: false, error: pErr.message };
        consultorNomeById = Object.fromEntries((profs ?? []).map((p) => [String(p.id), String(p.nome)]));
    }
    return { ok: true, rows, consultorNomeById };
}
export async function updateClientDeliveryFields(input) {
    const { error } = await supabase
        .from('clients')
        .update({
        cep: input.cep,
        logradouro: input.logradouro,
        bairro: input.bairro,
        municipio: input.municipio,
        uf: input.uf,
    })
        .eq('id', input.clientId);
    if (error)
        return { ok: false, error: error.message };
    return { ok: true };
}
