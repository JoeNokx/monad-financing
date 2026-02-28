import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { AppSkeleton } from '../../components/ui/AppSkeleton';

export default function AppIndex() {
  const router = useRouter();
  const didNavRef = useRef(false);

  useEffect(() => {
    if (didNavRef.current) return;
    didNavRef.current = true;
    router.replace('/(app)/home');
  }, [router]);

  return <AppSkeleton />;
}
