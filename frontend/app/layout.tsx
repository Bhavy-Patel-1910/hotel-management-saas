import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Smart Restaurant & Hotel SaaS",
  description: "Next-Gen QR Ordering, Real-Time Kitchen & Hotel Management System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#3B2118',
              color: '#FFF8EE',
              borderRadius: '16px',
              padding: '12px 18px',
              boxShadow: '0 10px 25px -5px rgba(59, 33, 24, 0.3)',
            },
            success: {
              iconTheme: {
                primary: '#248A52',
                secondary: '#FFF8EE',
              },
            },
            error: {
              iconTheme: {
                primary: '#D94A45',
                secondary: '#FFF8EE',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
