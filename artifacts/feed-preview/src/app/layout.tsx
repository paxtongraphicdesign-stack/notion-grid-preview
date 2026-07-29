import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Content Feed Preview',
  description: 'Instagram-style preview of your Notion content calendar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
