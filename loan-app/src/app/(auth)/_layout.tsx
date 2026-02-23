import { Redirect } from 'expo-router';

import { useSecurity } from '../../features/security/security.session';
import { AuthNavigator } from '../../navigation/AuthNavigator';

export default function AuthLayout() {
  const { hydrated, onboardingComplete } = useSecurity();

  if (!hydrated) return null;

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <AuthNavigator />;
}
