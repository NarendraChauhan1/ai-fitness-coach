import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Fitness Coach - 3D Pose Analysis',
  description:
    'Real-time AI-powered fitness coaching with 3D pose analysis and voice feedback',
  keywords: ['fitness', 'AI coach', 'pose detection', 'workout', 'form correction'],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(self)" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
