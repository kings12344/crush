import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
import {
  DEFAULT_PRIVACY_PREVIEW_PREFERENCES,
  loadPrivacyPreviewPreferences,
  savePrivacyPreviewPreferences,
  type PrivacyPreviewPreferences,
} from '../../lib/privacy-preferences';

export default function Profile() {
  const [preferences, setPreferences] = useState(DEFAULT_PRIVACY_PREVIEW_PREFERENCES);
  const [ready, setReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState('Loading device-only preview settings…');

  useEffect(() => {
    let active = true;
    loadPrivacyPreviewPreferences().then(({ preferences: saved, available }) => {
      if (!active) return;
      setPreferences(saved);
      setStorageStatus(
        available
          ? 'Saved on this device only. These settings do not affect a CRUSH account or server.'
          : 'Device storage is unavailable. Changes may not persist after you leave this screen.',
      );
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      savePrivacyPreviewPreferences(preferences).then((saved) => {
        if (!active) return;
        setStorageStatus(
          saved
            ? 'Saved on this device only. These settings do not affect a CRUSH account or server.'
            : 'Could not save on this device. Changes may be lost when you leave this screen.',
        );
      });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [preferences, ready]);

  const toggle = (key: keyof PrivacyPreviewPreferences, label: string, value: boolean, description: string) => (
    <Pressable
      key={key}
      disabled={!ready}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !ready }}
      style={[styles.row, !ready && styles.disabled]}
      onPress={() => setPreferences((current) => ({ ...current, [key]: !current[key] }))}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.item}>{label}</Text>
        <Text style={styles.sub}>{description}</Text>
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <Heading eyebrow="YOUR SPACE" title="Profile" subtitle="Your CRUSH identity, your rules." />
      <Panel>
        <View style={styles.avatar}><Text style={{ fontSize: 42 }}>🌷</Text></View>
        <Text style={styles.name}>Your profile</Text>
        <Text style={styles.muted}>Set up your display name, photos, interests and campus details when account creation is implemented.</Text>
      </Panel>

      <Heading eyebrow="CONTROL" title="Privacy preview" subtitle="These demo switches are stored on this device only. They do not change a real profile or account." />
      <Panel>
        {toggle('discoverable', 'Discoverable', preferences.discoverable, 'Preview the intended profile-discovery setting.')}
        {toggle('dating', 'Dating mode', preferences.dating, 'Preview the intended dating-discovery setting.')}
        {toggle('friends', 'Friends mode', preferences.friends, 'Preview the intended friends-discovery setting.')}
        {toggle('readReceipts', 'Read receipts', preferences.readReceipts, 'Preview the intended message-receipt setting.')}
        <Text accessibilityLiveRegion="polite" style={styles.storageStatus}>{storageStatus}</Text>
      </Panel>

      <Pressable accessibilityRole="button" onPress={() => router.push('/safety')}>
        <Panel><Text style={styles.item}>Safety center  ›</Text><Text style={styles.sub}>Blocking, reporting, privacy and safer-meetup guidance.</Text></Panel>
      </Pressable>
      {['Edit profile', 'Verification status', 'Notifications', 'Help and support', 'Account settings'].map((item) => (
        <Pressable key={item} onPress={() => Alert.alert(item, 'This feature will be connected after secure account services are implemented.')}>
          <Panel><Text style={styles.item}>{item}  ›</Text></Panel>
        </Pressable>
      ))}
      <Pressable onPress={() => Alert.alert('Account deletion', 'Account deletion will be available once backend accounts exist. Production must provide deletion and data-export controls.')}>
        <Text style={styles.delete}>Account deletion and data export</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFF0F6', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  name: { fontSize: 20, fontWeight: '900', textAlign: 'center', color: colors.black },
  muted: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.55 },
  item: { fontWeight: '800', color: colors.black },
  sub: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  switch: { width: 46, height: 27, borderRadius: 14, backgroundColor: '#D9D4D7', padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: colors.pink },
  knob: { width: 21, height: 21, borderRadius: 11, backgroundColor: 'white' },
  knobOn: { alignSelf: 'flex-end' },
  storageStatus: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  delete: { textAlign: 'center', color: colors.pink, fontWeight: '800', padding: 12 },
});
