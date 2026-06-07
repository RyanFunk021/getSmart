import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function AuthLayout() {
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
