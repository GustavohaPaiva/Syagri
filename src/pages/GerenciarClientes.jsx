import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClienteCard } from '../components/clientes/ClienteCard'
import { ModalClienteForm } from '../components/clientes/ModalClienteForm'
import { AlertMessage } from '../components/ui/AlertMessage'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import { MobileCardList } from '../components/ui/MobileCardList'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { useAbortableAsync } from '../hooks/useAbortableAsync'
import { useAuth } from '../hooks/useAuth'
import { fetchClientsList } from '../services/clientService'
import { formatShortDate } from '../utils/formatShortDate'

export function GerenciarClientes() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const isGestor = role === 'gestor'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  const loadClients = useCallback(async (isActive, search) => {
    setLoading(true)
    setLoadError(null)

    const result = await fetchClientsList({ search })

    if (!isActive()) return

    setLoading(false)
    if (!result.ok) {
      setLoadError(result.error)
      setRows([])
      return
    }
    setRows(result.rows)
  }, [])

  useAbortableAsync(
    async (_signal, isActive) => {
      await loadClients(isActive, searchQuery)
    },
    [loadClients, searchQuery],
  )

  const emptyMessage =
    rows.length === 0 && !searchQuery.trim()
      ? 'Nenhum cliente cadastrado.'
      : 'Nenhum resultado para a busca.'

  const tableColumns = useMemo(
    () => [
      {
        key: 'nome',
        header: 'Nome',
        cellClassName: 'font-medium text-slate-900',
        render: (row) => row.nome,
      },
      {
        key: 'cnpj_cpf',
        header: 'CPF / CNPJ',
        render: (row) => row.cnpj_cpf,
      },
      {
        key: 'local',
        header: 'Local',
        render: (row) =>
          [row.municipio, row.uf].filter(Boolean).join(' — ') || '—',
      },
      {
        key: 'created_at',
        header: 'Cadastro',
        render: (row) => formatShortDate(row.created_at),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        headerClassName: 'w-40',
        render: (row) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-0 px-3"
              onClick={() => navigate(`/clientes/${row.id}`)}
            >
              Ver detalhes
            </Button>
            {isGestor ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-0 px-3"
                onClick={() => {
                  setEditingClient(row)
                  setModalOpen(true)
                }}
              >
                Editar
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [isGestor, navigate],
  )

  function openCreateModal() {
    setEditingClient(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingClient(null)
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Clientes"
        actions={
          <Button type="button" onClick={openCreateModal}>
            Novo cliente
          </Button>
        }
      />

      {loadError ? <AlertMessage className="mt-6">{loadError}</AlertMessage> : null}

      <div className="mt-6 w-full sm:max-w-xs lg:max-w-sm">
        <SearchInput
          placeholder="Buscar por nome ou CPF/CNPJ…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <MobileCardList
        className="mt-6"
        items={rows}
        loading={loading}
        emptyMessage={emptyMessage}
        renderItem={(cliente) => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            canEdit={isGestor}
            onViewDetails={(id) => navigate(`/clientes/${id}`)}
            onEdit={(c) => {
              setEditingClient(c)
              setModalOpen(true)
            }}
          />
        )}
      />

      <DataTable
        className="mt-6"
        columns={tableColumns}
        rows={rows}
        loading={loading}
        emptyMessage={emptyMessage}
        getRowKey={(row) => row.id}
      />

      <ModalClienteForm
        open={modalOpen}
        mode={editingClient ? 'edit' : 'create'}
        clientId={editingClient?.id}
        initial={editingClient ?? undefined}
        onClose={closeModal}
        onSaved={() => void loadClients(() => true, searchQuery)}
      />
    </div>
  )
}
