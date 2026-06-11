import { forwardRef, useId } from "react";
import { IconSearch } from "../icons";

export const SearchInput = forwardRef(function SearchInput(
  { className = "", ariaLabel = "Pesquisar", id: idProp, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;

  return (
    <div className="relative w-full">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        id={inputId}
        type="search"
        aria-label={ariaLabel}
        className={[
          "h-11 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";
