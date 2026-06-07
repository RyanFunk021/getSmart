import React from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Card } from '../../components/ui/Card';
import { SessionLengthMinutes, AttentionFrequency } from '../../types/app';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <Text className="text-sm text-gray-700">{label}</Text>
      <View>{children}</View>
    </View>
  );
}

function SegmentControl<T extends string | number>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: string[];
}) {
  return (
    <View className="flex-row bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {options.map((opt, i) => (
        <TouchableOpacity
          key={String(opt)}
          onPress={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-md ${value === opt ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-xs font-medium ${value === opt ? 'text-brand-600' : 'text-gray-500'}`}>
            {labels ? labels[i] : String(opt)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuthStore();
  const {
    sessionLengthMinutes, setSessionLength,
    mindWanderFrequency, setMindWanderFrequency,
    difficultyMode, setDifficultyMode,
    fontSize, setFontSize,
    notificationsEnabled, setNotificationsEnabled,
  } = useSettingsStore();

  async function handleSignOut() {
    Alert.alert('Sign out?', '', [
      { text: 'Cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-black text-gray-900 mb-6">Settings</Text>

        <Card className="mb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Session
          </Text>
          <Row label="Session length">
            <SegmentControl<SessionLengthMinutes>
              options={[5, 10, 20, 0]}
              value={sessionLengthMinutes}
              onChange={setSessionLength}
              labels={['5m', '10m', '20m', '∞']}
            />
          </Row>
          <Row label="Mind-wander pings">
            <SegmentControl<AttentionFrequency>
              options={['off', 'low', 'medium', 'high']}
              value={mindWanderFrequency}
              onChange={setMindWanderFrequency}
              labels={['Off', 'Low', 'Med', 'High']}
            />
          </Row>
        </Card>

        <Card className="mb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Difficulty
          </Text>
          <Row label="Mode">
            <SegmentControl
              options={['auto', 'fixed'] as const}
              value={difficultyMode}
              onChange={setDifficultyMode}
              labels={['Auto', 'Fixed']}
            />
          </Row>
        </Card>

        <Card className="mb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Reading
          </Text>
          <Row label="Font size">
            <SegmentControl
              options={['small', 'medium', 'large'] as const}
              value={fontSize}
              onChange={setFontSize}
              labels={['S', 'M', 'L']}
            />
          </Row>
        </Card>

        <Card className="mb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Notifications
          </Text>
          <Row label="Daily reminder">
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: '#6366f1' }}
            />
          </Row>
        </Card>

        <Card className="mb-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            About
          </Text>
          <Row label="Version"><Text className="text-sm text-gray-400">1.0.0</Text></Row>
          <Row label="Built with">
            <Text className="text-sm text-gray-400">Claude · Supabase · Expo</Text>
          </Row>
        </Card>

        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-50 border border-red-200 rounded-xl py-4 items-center mt-2"
        >
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
