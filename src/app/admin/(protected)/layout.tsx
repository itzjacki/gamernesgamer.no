import { redirect } from 'next/navigation';
import { signOut } from '@/app/admin/actions';
import { createAuthClient } from '@/lib/supabase/server';
import Panel from '@/components/Panel';
import Button from '@/components/Button';

interface Props {
  children: React.ReactNode;
}

/**
 * The admin allowlist gate — one choke point for every /admin route.
 *
 * Being signed in is not the same as being an admin: Google authenticates any
 * Google user, but only a row in admin_user (checked by is_admin()) grants
 * access. Two layers run here:
 *   1. getClaims() — defense-in-depth. The proxy already redirects
 *      unauthenticated visitors; this covers the gap and gives us the claims.
 *   2. is_admin() RPC — the authoritative allowlist check, kept in the DB.
 *
 * An authenticated non-admin is shown a rejection screen with a sign-out
 * button rather than being bounced or auto-signed-out — auto sign-out would
 * cause a confusing sign-in-then-eject loop, and the rejection lets them
 * switch to the right Google account. /admin/login renders its own page
 * (unauthenticated), so this layout only guards authenticated access.
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
          {/* Accent eyebrow is the single "stop" signal — accent earns its
              place on a real status. Kept as explicit markup (not Panel's
              muted label prop) to preserve the accent color. */}
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
            // Which Google account was rejected — helps if signed into the
            // wrong one. Metadata register.
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
