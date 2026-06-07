import { supabase } from './supabase'

function mapNotification(row) {
  return {
    id: String(row.id),
    recipient_id: String(row.recipient_id),
    sender_id: row.sender_id != null ? String(row.sender_id) : null,
    simulation_id: row.simulation_id != null ? String(row.simulation_id) : null,
    type: row.type,
    title: String(row.title ?? ''),
    body: row.body != null ? String(row.body) : null,
    read_at: row.read_at != null ? String(row.read_at) : null,
    created_at: String(row.created_at),
    sender_nome: null,
  }
}

export async function fetchNotifications(params = {}) {
  let q = supabase
    .from('notifications')
    .select(`
      id,
      recipient_id,
      sender_id,
      simulation_id,
      type,
      title,
      body,
      read_at,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 50)

  if (params.unreadOnly) {
    q = q.is('read_at', null)
  }

  const { data, error } = await q
  if (error) return { ok: false, error: error.message }

  const rows = (data ?? []).map(mapNotification)
  const senderIds = [...new Set(rows.map((r) => r.sender_id).filter(Boolean))]
  let senderNomeById = {}

  if (senderIds.length > 0) {
    const { data: profs, error: profError } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', senderIds)

    if (profError) return { ok: false, error: profError.message }
    senderNomeById = Object.fromEntries(
      (profs ?? []).map((p) => [String(p.id), String(p.nome)]),
    )
  }

  return {
    ok: true,
    rows: rows.map((row) => ({
      ...row,
      sender_nome: row.sender_id ? senderNomeById[row.sender_id] ?? null : null,
    })),
  }
}

export async function fetchUnreadNotificationCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)

  if (error) return { ok: false, error: error.message }
  return { ok: true, count: count ?? 0 }
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function notifyGestoresSimulationPending(input) {
  const { error } = await supabase.rpc('notify_gestores_simulation_pending', {
    p_simulation_id: input.simulationId,
    p_title: input.title,
    p_body: input.body ?? null,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function notifyConsultorSimulationDecision(input) {
  const { error } = await supabase.rpc('notify_consultor_simulation_decision', {
    p_simulation_id: input.simulationId,
    p_type: input.type,
    p_title: input.title,
    p_body: input.body ?? null,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export function notificationTypeLabel(type) {
  switch (type) {
    case 'approval_request':
      return 'Solicitação de aprovação'
    case 'simulation_approved':
      return 'Simulação aprovada'
    case 'simulation_rejected':
      return 'Simulação reprovada'
    default:
      return 'Notificação'
  }
}
