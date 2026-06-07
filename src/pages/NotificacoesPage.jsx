import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconBell } from "../components/icons";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { useAbortableAsync } from "../hooks/useAbortableAsync";
import { useAuth } from "../hooks/useAuth";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTypeLabel,
} from "../services/notificationService";

  const FILTER_PILLS = [
    { key: "all", label: "Todas" },
    { key: "unread", label: "Não lidas" },
  ];

  function notificationBadgeClass(type) {
    switch (type) {
      case "approval_request":
        return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
      case "simulation_approved":
        return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
      case "simulation_rejected":
        return "bg-red-50 text-red-800 ring-1 ring-red-200";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  }

  function NotificationCard({ row, onOpen }) {
    const formattedDate = new Date(row.created_at).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <button
        type="button"
        onClick={() => onOpen(row)}
        className={[
          "w-full rounded-3xl border bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow]",
          row.read_at
            ? "border-slate-200 hover:border-primary-200 hover:shadow-md"
            : "border-primary-200 bg-primary-50/30 hover:border-primary-300 hover:shadow-md",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-700 ring-1 ring-primary-100">
              <IconBell className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">
                {row.title}
              </p>
              {row.body ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {row.body}
                </p>
              ) : null}
              {row.sender_nome ? (
                <p className="mt-2 text-xs text-slate-500">
                  De:{" "}
                  <span className="font-medium text-slate-700">
                    {row.sender_nome}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <span
            className={[
              "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
              notificationBadgeClass(row.type),
            ].join(" ")}
          >
            {notificationTypeLabel(row.type)}
          </span>
        </div>
        <p className="mt-4 text-xs text-slate-500">{formattedDate}</p>
      </button>
    );
  }

  export function NotificacoesPage() {
    const { user, role, initializing } = useAuth();
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quickFilter, setQuickFilter] = useState("all");
    const [reloadToken, setReloadToken] = useState(0);
    const [markingAll, setMarkingAll] = useState(false);

    const reload = useCallback(() => {
      setReloadToken((n) => n + 1);
    }, []);

    useAbortableAsync(
      async (_signal, isActive) => {
        if (!user?.id || !role) {
          if (!isActive()) return;
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        const result = await fetchNotifications({
          unreadOnly: quickFilter === "unread",
        });

        if (!isActive()) return;

        setLoading(false);
        if (!result.ok) {
          setError(result.error);
          setRows([]);
          return;
        }
        setRows(result.rows);
      },
      [user, role, quickFilter, reloadToken],
      !initializing && Boolean(user?.id) && Boolean(role),
    );

    const unreadCount = useMemo(
      () => rows.filter((row) => !row.read_at).length,
      [rows],
    );

    const filterPillClass = (key) =>
      [
        "h-9 rounded-2xl border px-4 text-sm font-medium transition-colors",
        quickFilter === key
          ? "border-primary-600 bg-primary-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-slate-50",
      ].join(" ");

    async function handleOpenNotification(row) {
      if (!row.read_at) {
        const result = await markNotificationRead(row.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? { ...item, read_at: new Date().toISOString() }
              : item,
          ),
        );
      }

      if (row.simulation_id) {
        navigate(
          `/simulador?simulationId=${encodeURIComponent(row.simulation_id)}`,
        );
      }
    }

    async function handleMarkAllRead() {
      setMarkingAll(true);
      const result = await markAllNotificationsRead();
      setMarkingAll(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reload();
    }

    return (
      <div className="w-full">
        <PageHeader
          eyebrow="Comunicação"
          title="Notificações"
          description={
            role === "gestor"
              ? "Solicitações de aprovação enviadas pelos consultores."
              : "Acompanhe retornos do gestor e confirmações de aprovação."
          }
          actions={
            unreadCount > 0 ? (
              <Button
                type="button"
                variant="secondary"
                loading={markingAll}
                onClick={() => void handleMarkAllRead()}
              >
                Marcar todas como lidas
              </Button>
            ) : null
          }
          className="mb-6"
        />

        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.key}
              type="button"
              className={filterPillClass(pill.key)}
              onClick={() => setQuickFilter(pill.key)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {error ? <AlertMessage className="mt-4">{error}</AlertMessage> : null}

        {loading || initializing ? (
          <EmptyState
            className="mt-6"
            title="Carregando notificações…"
            description="Aguarde um instante."
          />
        ) : rows.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Nenhuma notificação"
            description={
              role === "gestor"
                ? "Quando um consultor notificar uma simulação pendente, ela aparecerá aqui."
                : "Você será avisado quando o gestor responder à sua solicitação."
            }
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4">
            {rows.map((row) => (
              <NotificationCard
                key={row.id}
                row={row}
                onOpen={(item) => void handleOpenNotification(item)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
