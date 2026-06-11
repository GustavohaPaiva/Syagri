/** Utilitários de formatação, parsing e validação para dados brasileiros (somente frontend). */

export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function allSameDigit(digits) {
  return /^(\d)\1+$/.test(digits);
}

function isValidCpfChecksum(digits) {
  if (digits.length !== 11 || allSameDigit(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === Number(digits[10]);
}

function isValidCnpjChecksum(digits) {
  if (digits.length !== 14 || allSameDigit(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits[i]) * weights1[i];
  }
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  if (digit1 !== Number(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += Number(digits[i]) * weights2[i];
  }
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  return digit2 === Number(digits[13]);
}

export function parseCpfInput(raw) {
  return digitsOnly(raw).slice(0, 11);
}

export function parseCnpjInput(raw) {
  return digitsOnly(raw).slice(0, 14);
}

export function parseCpfCnpjInput(raw) {
  return digitsOnly(raw).slice(0, 14);
}

export function formatCpf(digits) {
  const d = parseCpfInput(digits);
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCnpj(digits) {
  const d = parseCnpjInput(digits);
  if (!d) return "";
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatCpfCnpj(digits) {
  const d = parseCpfCnpjInput(digits);
  if (!d) return "";
  return d.length <= 11 ? formatCpf(d) : formatCnpj(d);
}

export function displayCpfCnpj(value) {
  const d = parseCpfCnpjInput(value);
  return d ? formatCpfCnpj(d) : "";
}

export function validateCpf(digits, { required = false } = {}) {
  const d = parseCpfInput(digits);
  if (!d) {
    return required
      ? { ok: false, message: "Informe o CPF." }
      : { ok: true, value: "" };
  }
  if (d.length !== 11) {
    return { ok: false, message: "CPF deve conter 11 dígitos." };
  }
  if (!isValidCpfChecksum(d)) {
    return { ok: false, message: "CPF inválido." };
  }
  return { ok: true, value: d };
}

export function validateCnpj(digits, { required = false } = {}) {
  const d = parseCnpjInput(digits);
  if (!d) {
    return required
      ? { ok: false, message: "Informe o CNPJ." }
      : { ok: true, value: "" };
  }
  if (d.length !== 14) {
    return { ok: false, message: "CNPJ deve conter 14 dígitos." };
  }
  if (!isValidCnpjChecksum(d)) {
    return { ok: false, message: "CNPJ inválido." };
  }
  return { ok: true, value: d };
}

export function validateCpfCnpj(digits, { required = false } = {}) {
  const d = parseCpfCnpjInput(digits);
  if (!d) {
    return required
      ? { ok: false, message: "Informe CPF ou CNPJ." }
      : { ok: true, value: "" };
  }
  if (d.length <= 11) {
    const cpf = validateCpf(d, { required: true });
    if (!cpf.ok) return cpf;
    return { ok: true, value: cpf.value };
  }
  const cnpj = validateCnpj(d, { required: true });
  if (!cnpj.ok) return cnpj;
  return { ok: true, value: cnpj.value };
}

export function parsePhoneInput(raw) {
  return digitsOnly(raw).slice(0, 11);
}

export function formatPhone(digits) {
  const d = parsePhoneInput(digits);
  if (!d) return "";
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function displayPhone(value) {
  const d = parsePhoneInput(value);
  return d ? formatPhone(d) : "";
}

export function validatePhone(digits, { required = false } = {}) {
  const d = parsePhoneInput(digits);
  if (!d) {
    return required
      ? { ok: false, message: "Informe o telefone." }
      : { ok: true, value: "" };
  }
  if (d.length !== 10 && d.length !== 11) {
    return {
      ok: false,
      message: "Telefone deve conter 10 ou 11 dígitos (com DDD).",
    };
  }
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { ok: false, message: "DDD inválido." };
  }
  if (d.length === 11 && d[2] !== "9") {
    return {
      ok: false,
      message: "Celular deve começar com 9 após o DDD.",
    };
  }
  return { ok: true, value: d };
}

export function parseCepInput(raw) {
  return digitsOnly(raw).slice(0, 8);
}

/** @deprecated Prefer `parseCepInput` — mantido por compatibilidade com ViaCEP. */
export function normalizeCepDigits(raw) {
  return parseCepInput(raw);
}

export function formatCep(digits) {
  const d = parseCepInput(digits);
  if (!d) return "";
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function displayCep(value) {
  const d = parseCepInput(value);
  return d ? formatCep(d) : "";
}

export function validateCep(digits, { required = false } = {}) {
  const d = parseCepInput(digits);
  if (!d) {
    return required
      ? { ok: false, message: "Informe o CEP." }
      : { ok: true, value: "" };
  }
  if (d.length !== 8) {
    return { ok: false, message: "CEP deve conter 8 dígitos." };
  }
  return { ok: true, value: d };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value, { required = false } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required
      ? { ok: false, message: "Informe o e-mail." }
      : { ok: true, value: "" };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, message: "E-mail inválido." };
  }
  return { ok: true, value: trimmed };
}
