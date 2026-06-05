const SYAGRI_EMAIL_DOMAIN = '@syagri.com.br';
/**
 * Monta o e-mail corporativo a partir do login curto (ex.: `joao` → `joao@syagri.com.br`).
 * Se o usuário colar `joao@syagri.com.br`, usa apenas a parte local antes do `@`.
 */
export function buildSyagriEmail(usernameOrLocal) {
    const trimmed = usernameOrLocal.trim().toLowerCase();
    if (!trimmed)
        return '';
    const local = trimmed.includes('@')
        ? (trimmed.split('@')[0] ?? '').trim()
        : trimmed;
    if (!local)
        return '';
    return `${local}${SYAGRI_EMAIL_DOMAIN}`;
}
/** Extrai o login curto a partir do e-mail corporativo. */
export function parseSyagriLocalFromEmail(email) {
    const trimmed = (email ?? '').trim().toLowerCase();
    if (!trimmed)
        return '';
    if (!trimmed.includes('@'))
        return trimmed;
    return (trimmed.split('@')[0] ?? '').trim();
}
