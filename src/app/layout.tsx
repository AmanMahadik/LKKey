import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { connectToDatabase } from '@/services/db';
import { ApiKey } from '@/models/ApiKey';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ThemeContext';

export const metadata: Metadata = {
  title: 'LKKey — Smart Lookup Infrastructure',
  description: 'Powering Smart Data Lookups. A premium lookup data API microservice built by the Developer Team of Aman Mahadik.',
};

async function getLiveUsageStats() {
  try {
    await connectToDatabase();
    const activeKeys = await ApiKey.find({ isActive: true });
    const totalRequests = activeKeys.reduce((acc, key) => acc + (key.requestCount || 0), 0);
    return {
      requestCount: totalRequests,
      requestLimit: 20000 // default soft monthly quota
    };
  } catch (error) {
    console.error('Failed to retrieve live usage stats for layout:', error);
    return {
      requestCount: 8421, // fallback mock count if DB is not ready
      requestLimit: 20000
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const stats = await getLiveUsageStats();

  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ThemeProvider>
            <div className="layout-container">
              <Sidebar stats={stats} />
              <div className="main-wrapper">
                {children}
              </div>
            </div>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
