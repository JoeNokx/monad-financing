import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <SignIn />
    </div>
  );
}
