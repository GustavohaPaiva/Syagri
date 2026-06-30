import { roundMoney } from '../utils/roundMoney';
import { parseCpfCnpjInput } from '../utils/dataFormatters';
import { notifyConsultorSimulationDecision } from './notificationService';
import { supabase } from './supabase';

async function resolveClientId(input) {
    const nome = input.clientName.trim();
    const cnpj = parseCpfCnpjInput(input.clientCnpjCpf ?? '');
    if (!nome || !cnpj) {
        return { ok: false, error: 'Informe nome e CPF/CNPJ do cliente.' };
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
    return { ok: true, clientId };
}

function buildSimulationFields(input, status) {
    return {
        total_bruto: roundMoney(input.totalValor),
        total_proposta: roundMoney(input.totalProposta),
        status,
        tipo_frete: input.tipoFrete ?? null,
        origem_frete: input.origemFrete?.trim() || null,
        destino_frete: input.destinoFrete?.trim() || null,
        data_pagamento: input.dataPagamento || null,
        quarter: input.quarter ?? null,
    };
}

async function insertSimulationItems(simulationId, lines, statusLinha) {
    const itemsPayload = lines.map((line) => ({
        simulation_id: simulationId,
        product_id: line.productId,
        volume: line.volume,
        preco_unitario: roundMoney(line.precoUnitario),
        proposta: roundMoney(line.proposta),
        cultura: line.cultura ?? null,
        status_linha: statusLinha,
    }));
    const { error: itemsError } = await supabase
        .from('simulation_items')
        .insert(itemsPayload);
    if (itemsError) {
        return { ok: false, error: itemsError.message };
    }
    return { ok: true };
}
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
            cultura: String(item.cultura ?? ''),
            product: prod
                ? { nome: String(prod.nome ?? '') }
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
        cultura,
        products ( nome )
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
    if (input.lines.length === 0) {
        return { ok: false, error: 'Inclua ao menos um produto na simulação.' };
    }
    const clientResult = await resolveClientId(input);
    if (!clientResult.ok)
        return clientResult;
    const { data: simRow, error: simError } = await supabase
        .from('simulations')
        .insert({
        user_id: session.user.id,
        client_id: clientResult.clientId,
        ...buildSimulationFields(input, 'approved'),
    })
        .select('id')
        .single();
    if (simError || !simRow) {
        return {
            ok: false,
            error: simError?.message ?? 'Não foi possível salvar a simulação.',
        };
    }
    const itemsResult = await insertSimulationItems(simRow.id, input.lines, 'approved');
    if (!itemsResult.ok)
        return itemsResult;
    return { ok: true, simulationId: simRow.id };
}

export async function savePendingSimulation(input) {
    const { data: { session }, error: sessionError, } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
        return { ok: false, error: 'Sessão expirada. Faça login novamente.' };
    }
    if (input.lines.length === 0) {
        return { ok: false, error: 'Inclua ao menos um produto na simulação.' };
    }
    const clientResult = await resolveClientId(input);
    if (!clientResult.ok)
        return clientResult;
    const simulationFields = {
        client_id: clientResult.clientId,
        ...buildSimulationFields(input, 'pending'),
    };
    let simulationId = input.simulationId ?? null;
    if (simulationId) {
        const { error: simError } = await supabase
            .from('simulations')
            .update(simulationFields)
            .eq('id', simulationId)
            .eq('user_id', session.user.id);
        if (simError) {
            return { ok: false, error: simError.message };
        }
        const { error: deleteError } = await supabase
            .from('simulation_items')
            .delete()
            .eq('simulation_id', simulationId);
        if (deleteError) {
            return { ok: false, error: deleteError.message };
        }
    }
    else {
        const { data: simRow, error: simError } = await supabase
            .from('simulations')
            .insert({
            user_id: session.user.id,
            ...simulationFields,
        })
            .select('id')
            .single();
        if (simError || !simRow) {
            return {
                ok: false,
                error: simError?.message ?? 'Não foi possível salvar a simulação.',
            };
        }
        simulationId = simRow.id;
    }
    const itemsResult = await insertSimulationItems(simulationId, input.lines, 'pending');
    if (!itemsResult.ok)
        return itemsResult;
    return { ok: true, simulationId };
}

export async function updateSimulationStatus(simulationId, status, options = {}) {
    const { error } = await supabase
        .from('simulations')
        .update({ status })
        .eq('id', simulationId);
    if (error)
        return { ok: false, error: error.message };
    if (options.notifyConsultor && (status === 'approved' || status === 'rejected')) {
        const type = status === 'approved' ? 'simulation_approved' : 'simulation_rejected';
        const clientLabel = options.clientName?.trim() || 'Cliente';
        const title = status === 'approved'
            ? `Simulação aprovada — ${clientLabel}`
            : `Simulação reprovada — ${clientLabel}`;
        const notifyResult = await notifyConsultorSimulationDecision({
            simulationId,
            type,
            title,
            body: options.body ?? null,
        });
        if (!notifyResult.ok)
            return notifyResult;
    }
    return { ok: true };
}
export async function fetchSimulationsList(params) {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 50))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const search = (params.search ?? '').trim()

    let q = supabase
        .from('simulations')
        .select(`
      id,
      created_at,
      total_proposta,
      status,
      user_id,
      clients ( nome )
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (params.role === 'consultor') {
        q = q.eq('user_id', params.userId)
    }
    if (params.statusFilter) {
        q = q.eq('status', params.statusFilter)
    }

    if (search) {
        const pattern = `%${search.replace(/[%_,]/g, ' ').trim()}%`
        if (params.role === 'gestor') {
            const { data: profs } = await supabase
                .from('profiles')
                .select('id')
                .ilike('nome', pattern)
            const consultorIds = (profs ?? []).map((p) => p.id)
            if (consultorIds.length > 0) {
                q = q.or(`clients.nome.ilike.${pattern},user_id.in.(${consultorIds.join(',')})`)
            } else {
                q = q.ilike('clients.nome', pattern)
            }
        } else {
            q = q.ilike('clients.nome', pattern)
        }
    }

    const { data, error, count } = await q
    if (error)
        return { ok: false, error: error.message }
    const raw = (data ?? [])
    const rows = raw.map((row) => {
        const rawClient = row.clients
        const clientRow = Array.isArray(rawClient) ? rawClient[0] : rawClient
        const nome = clientRow && typeof clientRow === 'object' && 'nome' in clientRow
            ? String(clientRow.nome ?? '')
            : ''
        return {
            id: String(row.id),
            created_at: String(row.created_at),
            client_nome: nome,
            total_proposta: Number(row.total_proposta),
            status: row.status,
            user_id: String(row.user_id),
        }
    })
    let consultorNomeById = {}
    if (params.role === 'gestor' && rows.length > 0) {
        const ids = [...new Set(rows.map((r) => r.user_id))]
        const { data: profs, error: pErr } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', ids)
        if (pErr)
            return { ok: false, error: pErr.message }
        consultorNomeById = Object.fromEntries((profs ?? []).map((p) => [String(p.id), String(p.nome)]))
    }
    return { ok: true, rows, consultorNomeById, total: count ?? 0 }
}

export async function fetchGestorDashboardStats() {
    const [pendingRes, approvedRes, clientsRes, consultoresRes] = await Promise.all([
        supabase.from('simulations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('simulations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'consultor'),
    ]);
    if (pendingRes.error)
        return { ok: false, error: pendingRes.error.message };
    if (approvedRes.error)
        return { ok: false, error: approvedRes.error.message };
    if (clientsRes.error)
        return { ok: false, error: clientsRes.error.message };
    if (consultoresRes.error)
        return { ok: false, error: consultoresRes.error.message };
    return {
        ok: true,
        stats: {
            pendingCount: pendingRes.count ?? 0,
            approvedCount: approvedRes.count ?? 0,
            clientsCount: clientsRes.count ?? 0,
            consultoresCount: consultoresRes.count ?? 0,
        },
    };
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
