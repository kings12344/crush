import type { User } from '@supabase/supabase-js';
import { supabase, assertSupabaseConfigured } from './supabase';

export async function ensureProfile(user: User): Promise<void> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return;

  const metadataName = typeof user.user_metadata?.display_name === 'string'
    ? user.user_metadata.display_name.trim()
    : '';
  const emailName = user.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim() ?? '';
  const displayName = (metadataName || emailName || 'New member').slice(0, 40);

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    display_name: displayName,
    visibility: 'hidden',
  });

  if (insertError) throw insertError;
}
