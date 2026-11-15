import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const runtimeConfig = Constants.expoConfig?.extra ?? {};
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || runtimeConfig.supabaseUrl || '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || runtimeConfig.supabasePublishableKey || '';

export const isSupabaseConfigured =
  Platform.OS !== 'web' &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl) &&
  (supabasePublishableKey.startsWith('sb_publishable_') ||
    supabasePublishableKey.startsWith('eyJ'));

const manifestKey = 'crush.auth.manifest';
const chunkSize = 400;
const maxChunks = 100;
const validSessionId = (id: unknown): id is string =>
  typeof id === 'string' && /^[0-9]+-[a-z0-9]+$/.test(id);

const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const manifest = await SecureStore.getItemAsync(manifestKey);
    if (!manifest) return null;

    let parsed: { id: string; count: number };
    try {
      parsed = JSON.parse(manifest);
    } catch {
      await SecureStore.deleteItemAsync(manifestKey);
      return null;
    }

    if (!validSessionId(parsed.id) || !Number.isInteger(parsed.count) || parsed.count < 1 || parsed.count > maxChunks) {
      await SecureStore.deleteItemAsync(manifestKey);
      return null;
    }

    const chunks: string[] = [];
    for (let index = 0; index < parsed.count; index += 1) {
      const chunk = await SecureStore.getItemAsync(`crush.auth.${parsed.id}.${index}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  async setItem(_key: string, value: string): Promise<void> {
    const codePoints = Array.from(value);
    const chunks: string[] = [];
    for (let index = 0; index < codePoints.length; index += chunkSize) {
      chunks.push(codePoints.slice(index, index + chunkSize).join(''));
    }
    if (chunks.length === 0) chunks.push('');
    if (chunks.length > maxChunks) {
      throw new Error('Authentication session exceeds secure storage capacity.');
    }

    const previous = await SecureStore.getItemAsync(manifestKey);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      for (let index = 0; index < chunks.length; index += 1) {
        await SecureStore.setItemAsync(`crush.auth.${id}.${index}`, chunks[index]);
      }
      await SecureStore.setItemAsync(manifestKey, JSON.stringify({ id, count: chunks.length }));
    } catch (error) {
      await Promise.all(chunks.map((_, index) =>
        SecureStore.deleteItemAsync(`crush.auth.${id}.${index}`).catch(() => undefined),
      ));
      throw error;
    }

    if (previous) {
      try {
        const old = JSON.parse(previous) as { id?: string; count?: number };
        if (validSessionId(old.id) && Number.isInteger(old.count) && (old.count as number) > 0 && (old.count as number) <= maxChunks) {
          await Promise.all(Array.from({ length: old.count as number }, (_, index) =>
            SecureStore.deleteItemAsync(`crush.auth.${old.id}.${index}`).catch(() => undefined),
          ));
        }
      } catch {
        // A corrupt old manifest does not invalidate the newly saved session.
      }
    }
  },

  async removeItem(_key: string): Promise<void> {
    const previous = await SecureStore.getItemAsync(manifestKey);
    await SecureStore.deleteItemAsync(manifestKey);
    if (!previous) return;
    try {
      const old = JSON.parse(previous) as { id?: string; count?: number };
      if (validSessionId(old.id) && Number.isInteger(old.count) && (old.count as number) > 0 && (old.count as number) <= maxChunks) {
        await Promise.all(Array.from({ length: old.count as number }, (_, index) =>
          SecureStore.deleteItemAsync(`crush.auth.${old.id}.${index}`).catch(() => undefined),
        ));
      }
    } catch {
      // Ignore malformed stale metadata after clearing the active manifest.
    }
  },
};

const webStorage = {
  async getItem(_key: string) { return null; },
  async setItem(_key: string, _value: string) {},
  async removeItem(_key: string) {},
};

export const supabase = createClient(
  supabaseUrl || 'https://not-configured.supabase.co',
  supabasePublishableKey || 'not-configured',
  {
    auth: {
      storage: Platform.OS === 'web' ? webStorage : secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  },
);

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error('CRUSH backend configuration is missing. Install the app build with the Supabase project settings.');
  }
}
