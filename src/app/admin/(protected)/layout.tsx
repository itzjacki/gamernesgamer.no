import { redirect } from 'next/navigation';
import { signOut } from '@/app/admin/actions';
import { createAuthClient } from '@/lib/supabase/server';
import Panel from '@/components/Panel';
import Button from '@/components/Button';

interface Props {
  children: React.ReactNode;
}

/**
 * The admin allowlist gate for every protected /admin route. Any Google user
 * can sign in; only is_admin() grants access. getClaims() repeats the proxy's
 * check as defense-in-depth.
 *
 * A signed-in non-admin gets a rejection screen rather than an auto sign-out,
 * which would loop sign-in-then-eject and hide which account was rejected.
 */
export default async function AdminLayout({ children }: Props) {
  const supabase = await createAuthClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    redirect('/admin/login');
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');

  if (!isAdmin) {
    const email =
      typeof claimsData.claims.email === 'string'
        ? claimsData.claims.email
        : null;

    return (
      <section className='flex min-h-[70svh] items-center justify-center'>
        <Panel className='w-80 sm:w-100'>
          {/* Not Panel's label prop: that one is muted, this is the accent
              "stop" signal. */}
          <p className='text-accent font-mono text-xs tracking-wider uppercase'>
            Ingen tilgang
          </p>

          <h1 className='text-text mt-2 text-2xl font-extrabold'>
            Du er logget inn, men ikke administrator
          </h1>

          <p className='text-text-muted mt-3 text-sm leading-relaxed'>
            Tilgang til adminpanelet er invitasjonsbasert. Kontoen din er logget
            inn, men står ikke på administratorlisten.
          </p>

          {email ? (
            <p className='text-text-muted mt-3 font-mono text-xs'>{email}</p>
          ) : null}

          <div className='border-border -mx-6 mt-8 border-t sm:-mx-10' />

          <form action={signOut} className='mt-8'>
            <Button type='submit' width='full'>
              Logg ut
            </Button>
          </form>

          <p className='text-text-muted mt-4 font-mono text-xs'>
            Be en eksisterende administrator om tilgang.
          </p>
        </Panel>
      </section>
    );
  }

  return <>{children}</>;
}
