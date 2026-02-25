import { useClerk } from '@clerk/clerk-react';
import { useEffect } from 'react';

export default function Logout() {
  const { signOut } = useClerk();

  useEffect(() => {
    void signOut(() => {
      window.location.href = '/login';
    });
  }, [signOut]);

  return <div className="p-6 text-sm text-slate-600">Signing out…</div>;
}
