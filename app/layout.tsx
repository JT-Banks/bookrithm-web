import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bookrithm",
  description: "Book tracking and discovery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${lora.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col text-zinc-100"
        style={{
          backgroundImage: 'url(/images/bg-library.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundColor: '#0e0804', /* fallback while image loads */
        }}
      >
        {/* GoogleOAuthProvider gives every page access to Google Sign-In */}
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <AuthProvider>
            {/* Dark overlay so content stays readable over the background image */}
            <div className="min-h-full flex flex-col bg-zinc-950/60 backdrop-blur-[1px]">
              <Header />
              {children}
            </div>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}