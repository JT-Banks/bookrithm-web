'use client';

import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

// This component renders the Google Sign-In button.
// It's a client component because it handles user interaction (button clicks).
export function SignInButton() {
  const { signIn } = useAuth();         // Our sign-in function from useAuth
  const router = useRouter();           // Next.js router - like a redirect in Spring MVC

  // Called by Google when the user successfully picks their account
  // `response.credential` is the Google ID token (a JWT string)
  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) return;

    try {
      // Try to sign in - this saves the token and fetches their profile
      await signIn(response.credential);

      // If we get here, the user has a profile - keep them on the home dashboard.
      router.replace('/');

    } catch (error) {
      // If the backend returns 404, this user hasn't registered yet
      if (error instanceof ApiError && error.statusCode === 404) {
        // Send them to the registration page to pick a username
        router.push('/register');
      } else {
        // Something unexpected went wrong
        console.error('Sign in failed:', error);
      }
    }
  };

  return (
    <div className="group relative h-11 w-[240px]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 overflow-hidden rounded-lg border border-amber-700/60 bg-[#1b0d05] px-4 text-sm font-medium text-[#f3dfbd] shadow-[0_12px_24px_rgba(0,0,0,0.34),0_0_18px_rgba(202,140,64,0.10),inset_0_1px_0_rgba(255,226,170,0.12),inset_0_-16px_28px_rgba(0,0,0,0.28)] transition duration-200 group-hover:border-amber-500/85 group-hover:text-[#fff1ce] group-hover:shadow-[0_14px_28px_rgba(0,0,0,0.38),0_0_22px_rgba(230,162,70,0.30),inset_0_1px_0_rgba(255,229,177,0.20),inset_0_-16px_28px_rgba(0,0,0,0.24)]">
        <span
          className="absolute inset-0 opacity-80"
          style={{
            background: [
              'linear-gradient(180deg, rgba(83,42,15,0.48), rgba(24,11,5,0.90))',
              'linear-gradient(90deg, rgba(255,226,170,0.05), transparent 25%, transparent 75%, rgba(0,0,0,0.18))',
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 44px)',
            ].join(', '),
          }}
          aria-hidden="true"
        />
        <svg className="relative h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
        </svg>
        <span className="relative">Sign in with Google</span>
      </div>

      <div className="absolute inset-0 opacity-0">
        <GoogleLogin
          width="240"
          size="large"
          onSuccess={handleSuccess}
          onError={() => console.error('Google sign-in failed')}
        />
      </div>
    </div>
  );
}
