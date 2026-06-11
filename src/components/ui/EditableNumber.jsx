import { useEffect, useRef, useState } from "react";

export function EditableNumber({
  value,
  onChange,
  disabled = false,
  min = 0,
  step = 0.001,
  decimals = 3,
  className = "",
  inputClassName = "",
  ariaLabel,
  centered = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setDraft(String(value));
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const n = Number.parseFloat(draft.replace(",", "."));
    onChange(Number.isFinite(n) ? Math.max(min, n) : min);
  }

  function cancel() {
    setEditing(false);
  }

  const display =
    Number.isFinite(value) && value !== null
      ? value.toLocaleString("pt-BR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        })
      : "—";

  if (disabled) {
    return (
      <span
        className={[
          "finance-text text-base font-semibold text-slate-900",
          centered ? "block w-full text-center" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {display}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        step={step}
        aria-label={ariaLabel}
        className={[
          "finance-text h-9 w-full min-w-[4.5rem] rounded-xl border border-primary-300 bg-white px-2 text-base font-semibold text-slate-900 outline-none ring-2 ring-primary-500/20",
          centered ? "mx-auto max-w-[6rem] text-center" : "",
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={
        ariaLabel ? `${ariaLabel}: ${display}. Clique para editar.` : undefined
      }
      className={[
        "finance-text cursor-text rounded-lg px-1 text-base font-semibold text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-4 transition-colors hover:text-primary-800 hover:decoration-primary-400",
        centered ? "mx-auto block w-full text-center" : "text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={startEditing}
    >
      {display}
    </button>
  );
}
