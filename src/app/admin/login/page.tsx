import type { Metadata } from 'next';
import { signIn } from '@/app/admin/actions';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Panel from '@/components/Panel';

export const metadata: Metadata = {
  title: 'Logg inn — Adminpanel',
};

interface Props {
  // Next 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <section className='flex min-h-[70svh] items-center justify-center'>
      <Panel className='w-80 sm:w-100'>
        <p className='text-text-muted font-mono text-xs tracking-wider uppercase'>
          Adminpanel
        </p>

        <h1 className='text-text mt-2 text-2xl font-extrabold'>Logg inn</h1>

        <p className='text-text-muted mt-3 text-sm leading-relaxed'>
          Administrasjonspanelet for Gamernes Gamer. Logg inn for å fortsette.
        </p>

        {error ? (
          // Shown when the OAuth init or callback exchange fails (not the
          // non-admin case, which the admin layout handles).
          <p className='text-accent mt-4 font-mono text-xs'>
            Innloggingen gikk ikke gjennom. Prøv igjen.
          </p>
        ) : null}

        {/* Divider — negative margin so the hairline runs through the panel
            edges, keeping grid lines continuous. */}
        <div className='border-border -mx-6 mt-8 border-t sm:-mx-10' />

        <form action={signIn} className='mt-8'>
          <GoogleSignInButton
            label='Logg inn med Google'
            pendingLabel='Sender deg til Google …'
          />
        </form>
      </Panel>
    </section>
  );
}
