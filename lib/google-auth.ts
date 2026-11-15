import { Linking } from 'react-native';
import { assertSupabaseConfigured, supabase } from './supabase';

export async function startGoogleSignIn(): Promise<void> {
  assertSupabaseConfigured();

  const redirectTo = 'crush://auth/callback';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('Google sign-in did not return an authorization URL.');

  await Linking.openURL(data.url);
}
