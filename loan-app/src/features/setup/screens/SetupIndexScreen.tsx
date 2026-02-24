import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSecurity } from '../../security/security.session';
import { AppSkeleton } from '../../../components/ui/AppSkeleton';
import type { ProfileMeResponse } from '../../../types/profile';

function nextRouteFromProfile(res: ProfileMeResponse | null) {
  const p = res?.profile;
  if (!p) return '/(setup)/about';

  if (!p.phoneNumber || !p.dateOfBirth || !p.gender || !p.address) return '/(setup)/about';
  if (!p.emergencyName || !p.emergencyPhone || !p.emergencyRelationship) return '/(setup)/emergency';
  if (!p.mobileNetwork || !p.mobileNumber || !p.mobileName) return '/(setup)/mobile-money';

  return '/(app)';
}

export default function SetupIndexScreen() {
  const router = useRouter();
  const lastNextRef = useRef<string | null>(null);
  const { appData } = useSecurity();

  useEffect(() => {
    if (!appData) return;

    const next = nextRouteFromProfile(appData.profileMe ?? null);
    if (lastNextRef.current === next) return;
    lastNextRef.current = next;
    router.replace(next);
  }, [appData, router]);

  if (!appData) {
    return <AppSkeleton />;
  }

  return null;
}
