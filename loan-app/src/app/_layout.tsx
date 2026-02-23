import '../../global.css';

import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { env } from '../config/env';
import { SecurityProvider } from '../features/security/security.session';
import { RootNavigator } from '../navigation/RootNavigator';

export default function RootLayout() {
  const publishableKey = env.clerkPublishableKey;

  if (!publishableKey) {
    return (
      <SecurityProvider>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </SecurityProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SecurityProvider>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </SecurityProvider>
    </ClerkProvider>
  );
}
