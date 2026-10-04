import type { Metadata } from 'next';
import { signIn } from '@/app/admin/actions';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export const metadata: Metadata = {
  // PLACEHOLDER: page title — written by a human.
  title: '[PLACEHOLDER: Logg inn]',
};

interface Props {
  // Next 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <section className='flex min-h-[70svh] items-center justify-center'>
      <div className='border-border bg-bg w-80 border p-6 sm:w-100 sm:p-10'>
        {/* PLACEHOLDER eyebrow — e.g. "ADMIN". Written by a human. */}
        <p className='text-text-muted font-mono text-xs tracking-wider uppercase'>
          [PLACEHOLDER: eyebrow]
        </p>

        {/* PLACEHOLDER heading — e.g. "Logg inn". Written by a human. */}
        <h1 className='text-text mt-2 text-2xl font-extrabold'>
          [PLACEHOLDER: overskrift]
        </h1>

        {/* PLACEHOLDER sub — e.g. a short explanation. Written by a human. */}
        <p className='text-text-muted mt-3 text-sm leading-relaxed'>
          [PLACEHOLDER: kort forklaring på hva dette er]
        </p>

        {error ? (
          // PLACEHOLDER error line — written by a human. Shown when the OAuth
          // init or callback exchange fails (not the non-admin case, which the
          // admin layout handles).
          <p className='text-accent mt-4 font-mono text-xs'>
            [PLACEHOLDER: feilmelding ved innlogging]
          </p>
        ) : null}

        {/* Divider — negative margin so the hairline runs through the panel
            edges, keeping grid lines continuous. */}
        <div className='border-border -mx-6 mt-8 border-t sm:-mx-10' />

        <form action={signIn} className='mt-8'>
          <GoogleSignInButton
            // PLACEHOLDER: Google-approved label string, chosen by a human.
            label='[PLACEHOLDER: Logg på med Google]'
            // PLACEHOLDER: shown while redirecting. Written by a human.
            pendingLabel='[PLACEHOLDER: Sender deg til Google …]'
          />
        </form>

        {/* PLACEHOLDER footnote — e.g. "Kun for inviterte". Written by a human. */}
        <p className='text-text-muted mt-4 font-mono text-xs'>
          [PLACEHOLDER: fotnote]
        </p>
      </div>
    </section>
  );
}
