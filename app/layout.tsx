import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Page Quality Auditor',
  description:
    'Evidence-led healthcare page audits. Explore trust signals, technical SEO, answer readiness and conversion UX with transparent evidence and human review.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
