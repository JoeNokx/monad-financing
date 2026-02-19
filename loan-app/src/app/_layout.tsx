import '../../global.css';

import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { requireEnv } from '../config/env';
import { RootNavigator } from './RootNavigator';

export default function RootLayout() {
  const publishableKey = requireEnv('clerkPublishableKey');

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
