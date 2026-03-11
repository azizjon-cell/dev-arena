/**
 * Root Layout - Next.js App Router
 */

import './globals.css';

export const metadata = {
  title: 'DevArena - AI Code Battle & Learning Platform',
  description: 'Учись программировать, соревнуйся с другими и стань легендой',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-dark-bg text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
