import type { Metadata } from 'next';
import '@/styles/global.css';
import SeasonHeader from '@/components/SeasonHeader';

export const metadata: Metadata = {
  title: {
    template: '%s - Gamernes Gamer',
    default: 'Gamernes Gamer',
  },
  description:
    'Gamernes Gamer: Sannsynligvis Norges mest prestisjetunge gamingkonkurranse.',
  icons: {
    icon: '/favicon.ico',
  },
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang='no'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;500&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='bg-bg text-text font-sans'>
        {/* Blueprint grid — scrolls with page, centered on viewport.
            Container: 880px = 22 × 40px. Content: 800px = 20 × 40px. */}
        <div className='relative min-h-screen'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-0'
            style={{
              backgroundImage:
                'linear-gradient(rgba(232,216,216,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,216,216,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: 'calc(50% + 20px) calc(50% + 20px)',
            }}
          />
          <div className='relative mx-auto w-full max-w-220 px-4 sm:px-6 lg:px-10'>
            <SeasonHeader />
            <main className='flex flex-col gap-20 pb-20 sm:gap-28'>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
