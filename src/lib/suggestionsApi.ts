import { supabase } from './supabase';
import { Suggestion } from '../types';

export async function submitSuggestion(suggestion: Suggestion): Promise<{ success: boolean; error?: string }> {
  if (!suggestion.message || suggestion.message.trim() === '') {
    return { success: false, error: 'Mensagem é obrigatória' };
  }
  if (suggestion.message.length > 2000) {
    return { success: false, error: 'Mensagem excede 2000 caracteres' };
  }
  if (!supabase) {
    return { success: false, error: 'Serviço de sugestão indisponível: configure o Supabase.' };
  }

  try {
    const { error } = await supabase
      .from('suggestions')
      .insert([{
        ...suggestion,
        status: 'new'
      }]);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error submitting suggestion:', err);
    return { success: false, error: err.message || 'Erro ao enviar sugestão' };
  }
}
