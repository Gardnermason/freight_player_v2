import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Your Freight Calculator',
  description: 'Your Freight Calculator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bungee&family=Caveat:wght@700&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-roboto">
        {children}
      </body>
    </html>
  );
}
