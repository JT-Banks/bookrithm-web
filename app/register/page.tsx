'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

// The shape of our form - mirrors RegisterUserRequest in types/api.ts
// but we keep it local since it's just for this form's state
interface RegisterForm {
  username: string;
  displayName: string;
  email: string;
}

export default function RegisterPage() {
  const { token, signIn } = useAuth();
  const router = useRouter();

  // One state object for the whole form - like a DTO with all three fields
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    displayName: '',
    email: '',
  });

  // Separate state for loading and error feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

    // handleChange updates one field in the form object at a time.
  // `e.target.name` tells us WHICH input changed (username, displayName, or email)
  // `e.target.value` is what the user typed
  // The spread `...form` keeps the other fields unchanged - like a partial update
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handleSubmit fires when the user clicks "Create Account"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the browser's default "reload page" form behavior

    // If somehow they got here without a token, send them back to sign in
    if (!token) {
      router.push('/');
      return;
    }

    setIsSubmitting(true); // Disable the button while we're waiting
    setError(null);        // Clear any previous error message

    try {
      // Call POST /users/me to create their profile
      await authApi.register({
        username: form.username,
        displayName: form.displayName,
        email: form.email,
      });

      // Registration succeeded! Now sign them in properly (loads their profile into state)
      await signIn(token);

      // Send them to their shelves
      router.push('/shelves');

    } catch (err) {
      if (err instanceof ApiError) {
        // Backend gave us a specific error message - show it to the user
        setError(err.errorResponse.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false); // Re-enable the button no matter what happened
    }
  };

    return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Every great story needs an author. Let's set yours up.
          </p>
        </div>

        {/* The form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Username field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. the_page_turner"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <span className="text-xs text-zinc-400">3–40 characters, letters, numbers, and underscores only</span>
          </div>

          {/* Display Name field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={form.displayName}
              onChange={handleChange}
              placeholder="e.g. Keeper of Unfinished Books"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="reader@example.com"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {/* Error message - only shown when `error` state is not null */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>

        </form>
      </div>
    </main>
  );
}