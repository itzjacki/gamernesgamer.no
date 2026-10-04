import type { Metadata } from 'next';
import { signOut } from '@/app/admin/actions';

export const metadata: Metadata = {
  // PLACEHOLDER: page title — written by a human.
  title: '[PLACEHOLDER: Admin]',
};

/**
 * Admin dashboard landing. The (protected) layout has already verified the
 * visitor is an allowlisted admin, so this page can assume access. Minimal for
 * now — it exists to verify the full Google auth loop end to end; the results
 * entry + review UI (next steps) will live under this route group.
 */
export default function AdminDashboardPage() {
  return (
    <section className='flex flex-col gap-6'>
      {/* PLACEHOLDER heading — written by a human. */}
      <h1 className='text-text text-3xl font-extrabold'>
        [PLACEHOLDER: Admin — oversikt]
      </h1>

      {/* PLACEHOLDER body — written by a human. */}
      <p className='text-text-muted text-sm leading-relaxed'>
        [PLACEHOLDER: kort intro / hva som kommer her]
      </p>

      <form action={signOut}>
        <button
          type='submit'
          className='border-border bg-surface text-text hover:border-accent focus-visible:outline-accent active:bg-bg flex h-11 items-center justify-center border px-6 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
        >
          {/* PLACEHOLDER: e.g. "Logg ut". Written by a human. */}
          [PLACEHOLDER: Logg ut]
        </button>
      </form>
    </section>
  );
}
