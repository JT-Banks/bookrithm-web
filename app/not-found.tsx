import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
      <p className="text-sm text-zinc-600 uppercase tracking-widest mb-4">404</p>
      <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-zinc-500 mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-800 px-5 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}
