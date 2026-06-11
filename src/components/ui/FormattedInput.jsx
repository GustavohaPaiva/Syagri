import { forwardRef } from "react";
import {
  formatCep,
  formatCpfCnpj,
  formatPhone,
  parseCepInput,
  parseCpfCnpjInput,
  parsePhoneInput,
} from "../../utils/dataFormatters";
import { Input } from "./Input";

const FORMATTERS = {
  cpfCnpj: {
    parse: parseCpfCnpjInput,
    format: formatCpfCnpj,
    inputMode: "numeric",
  },
  phone: {
    parse: parsePhoneInput,
    format: formatPhone,
    inputMode: "tel",
  },
  cep: {
    parse: parseCepInput,
    format: formatCep,
    inputMode: "numeric",
  },
};

export const FormattedInput = forwardRef(function FormattedInput(
  { format: formatType, value, onChange, ...props },
  ref,
) {
  const cfg = FORMATTERS[formatType];
  if (!cfg) {
    throw new Error(`FormattedInput: tipo desconhecido "${formatType}".`);
  }

  const formattedValue = cfg.format(value ?? "");

  function handleChange(e) {
    const raw = cfg.parse(e.target.value);
    onChange?.({
      ...e,
      target: { ...e.target, value: raw },
    });
  }

  return (
    <Input
      ref={ref}
      value={formattedValue}
      onChange={handleChange}
      inputMode={cfg.inputMode}
      {...props}
    />
  );
});

FormattedInput.displayName = "FormattedInput";
