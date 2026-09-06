import type { Metadata } from 'next';
import '@/styles/global.css';
import SeasonHeader from '@/components/SeasonHeader';

export const metadata: Metadata = {
  title: {
    template: '%s - Gamernes Gamer',
    default: 'Gamernes Gamer',
  },
  description: 'Gamernes Gamer: Sannsynligvis Norges mest prestisjetunge gamingkonkurranse.',
  icons: {
    icon: '/favicon.svg',
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
          href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Quantico:wght@400;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='bg-grayish text-white'>
        <div className='mx-auto mt-4 mb-20 flex flex-col items-center p-4 sm:mt-16'>
          <SeasonHeader />
          <main className='flex flex-col items-center gap-20 sm:gap-28'>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
