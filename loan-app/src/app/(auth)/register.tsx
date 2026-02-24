import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function RegisterRedirect() {
  const router = useRouter();
  const didNavRef = useRef(false);

  useEffect(() => {
    if (didNavRef.current) return;
    didNavRef.current = true;
    router.replace('/(auth)/sign-up');
  }, [router]);

  return null;
}
