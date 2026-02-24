import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function LoginScreen() {
  const router = useRouter();
  const didNavRef = useRef(false);

  useEffect(() => {
    if (didNavRef.current) return;
    didNavRef.current = true;
    router.replace('/(auth)/sign-in');
  }, [router]);

  return null;
}
