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

      // If we get here, the user has a profile - go to the app!
      router.push('/shelves');

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
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.error('Google sign-in failed')}
    />
  );
}