import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertDialog } from "../components/ui/AlertDialog";

const AlertDialogContext = createContext(null);

export function AlertDialogProvider({ children }) {
  const [state, setState] = useState(null);

  const closeAlert = useCallback(() => {
    setState((prev) => (prev ? { ...prev, open: false } : null));
  }, []);

  const showAlert = useCallback((options) => {
    setState({
      open: true,
      title: options.title ?? "Atenção",
      message: options.message ?? "",
      tone: options.tone ?? "error",
      confirmLabel: options.confirmLabel ?? "Entendi",
    });
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertDialogContext.Provider value={value}>
      {children}
      {state ? (
        <AlertDialog
          open={state.open}
          onClose={closeAlert}
          title={state.title}
          tone={state.tone}
          confirmLabel={state.confirmLabel}
        >
          {state.message}
        </AlertDialog>
      ) : null}
    </AlertDialogContext.Provider>
  );
}

export function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error("useAlertDialog deve ser usado dentro de AlertDialogProvider.");
  }
  return ctx;
}
