import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name.trim()) {
      Alert.alert('Please enter your name');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: name,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    setLoading(false);
    Alert.alert('Welcome!', 'Check your email to verify your account.');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-black text-brand-600 mb-2">Get Smart</Text>
        <Text className="text-base text-gray-500 mb-10">Create your account</Text>

        <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base text-gray-900"
          placeholder="Your name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-base text-gray-900"
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-base text-gray-900"
          placeholder="At least 8 characters"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Create Account" onPress={handleSignup} loading={loading} size="lg" />

        <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center py-3">
          <Text className="text-gray-500">
            Have an account?{' '}
            <Text className="text-brand-600 font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
