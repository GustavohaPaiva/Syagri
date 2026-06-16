import { Button } from "./Button";

export function ModalFormFooter({
  formId,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  loading = false,
  disabled = false,
  onCancel,
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="secondary"
        disabled={loading || disabled}
        className="w-full shrink-0 sm:w-auto sm:flex-1"
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        form={formId}
        loading={loading}
        disabled={disabled}
        className="w-full shrink-0 sm:w-auto sm:flex-1"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
