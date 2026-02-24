import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function RegistrationDetailsRoute() {
  const router = useRouter();
  const didNavRef = useRef(false);

  useEffect(() => {
    if (didNavRef.current) return;
    didNavRef.current = true;
    router.replace('/(setup)/about');
  }, [router]);

  return null;
}
