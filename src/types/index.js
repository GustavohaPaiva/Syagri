/** Perfis de acesso no domínio Syagri */
export const USER_ROLES = ['gestor', 'consultor'];
export function isGestorProfile(profile) {
    return profile.role === 'gestor';
}
export function isConsultorProfile(profile) {
    return profile.role === 'consultor';
}
