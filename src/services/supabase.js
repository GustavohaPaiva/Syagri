import { createClient } from '@supabase/supabase-js';
function readRequiredEnv(name) {
    const raw = import.meta.env[name];
    if (typeof raw !== 'string' || raw.trim().length === 0) {
        throw new Error(`Variável de ambiente obrigatória ausente ou inválida: ${name}. Defina-a em .env na raiz do projeto.`);
    }
    return raw.trim();
}
const supabaseUrl = readRequiredEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = readRequiredEnv('VITE_SUPABASE_ANON_KEY');
/**
 * Cliente Supabase singleton para uso no browser (Vite).
 * Tipado com {@link Database}; atualize `src/types/database.ts` quando o schema existir.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
