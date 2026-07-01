import BookDetailPage from '@/components/features/BookDetailPage';

// Generates a static HTML shell for the dynamic route.
// Firebase Hosting rewrites all /books/:id requests to this shell;
// the actual ID is then read from the URL by useParams() on the client.
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function Page() {
  return <BookDetailPage />;
}
