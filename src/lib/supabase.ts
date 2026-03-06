import { createClient } from '@supabase/supabase-js';

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^['"\u201C\u201D]+|['"\u201C\u201D]+$/g, '');
}

function isValidHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const supabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
const hasValidUrl = isValidHttpUrl(supabaseUrl);

export const isSupabaseConfigured = Boolean(hasValidUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Configuração inválida/ausente (VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY). O app vai operar em modo limitado.',
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
