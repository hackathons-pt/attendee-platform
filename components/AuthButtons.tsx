'use client';

import { signIn, signOut } from 'next-auth/react';

export function SignInButton() {
  return (
    <button className="primary" onClick={() => signIn('pretix')} type="button">
      Sign in with hackathons.pt
    </button>
  );
}

export function SignOutButton() {
  return (
    <button className="primary" onClick={() => signOut()} type="button">
      Sign out
    </button>
  );
}
