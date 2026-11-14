import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrivacyPreviewPreferences = {
  discoverable: boolean;
  dating: boolean;
  friends: boolean;
  readReceipts: boolean;
};

export const DEFAULT_PRIVACY_PREVIEW_PREFERENCES: PrivacyPreviewPreferences = {
  discoverable: true,
  dating: true,
  friends: true,
  readReceipts: false,
};

const STORAGE_KEY = 'crush.privacy-preview.v1';

export async function loadPrivacyPreviewPreferences(): Promise<{
  preferences: PrivacyPreviewPreferences;
  available: boolean;
}> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { preferences: DEFAULT_PRIVACY_PREVIEW_PREFERENCES, available: true };
    }

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return { preferences: DEFAULT_PRIVACY_PREVIEW_PREFERENCES, available: true };
    }

    const candidate = parsed as Partial<PrivacyPreviewPreferences>;
    const preferences = { ...DEFAULT_PRIVACY_PREVIEW_PREFERENCES };
    for (const key of Object.keys(preferences) as (keyof PrivacyPreviewPreferences)[]) {
      if (typeof candidate[key] === 'boolean') {
        preferences[key] = candidate[key];
      }
    }
    return { preferences, available: true };
  } catch {
    return { preferences: DEFAULT_PRIVACY_PREVIEW_PREFERENCES, available: false };
  }
}

export async function savePrivacyPreviewPreferences(
  preferences: PrivacyPreviewPreferences,
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
