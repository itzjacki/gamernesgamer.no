import type { Metadata } from 'next';
import { signOut } from '@/app/admin/actions';
import { createReadClient } from '@/lib/supabase/read';
import { createAuthClient } from '@/lib/supabase/server';
import { currentSeason } from '@/data/sesong';
import Panel from '@/components/Panel';
import Button from '@/components/Button';
import DbOverview from './DbOverview';
import AdminManagement, { type AdminRow } from './AdminManagement';
import { type AddableUser } from './AddAdminForm';

export const metadata: Metadata = {
  title: 'Adminpanel',
};

/**
 * Admin dashboard landing. The (protected) layout has already verified the
 * visitor is an allowlisted admin. Renders two in-place panels under the single
 * page heading: a read-only DB overview (a sanity glance that the seeded data
 * is intact) and admin membership management (add/remove admins). Results
 * entry/review will join this panel in a later phase.
 *
 * Data: seasons/games counts come from the public-read tables via the
 * publishable read client (head-only exact counts). The user list comes from
 * the admin-only admin_list_users() RPC — reading auth.users requires that
 * privileged path — and is split into current admins + addable (non-admin)
 * users for the management panel. All reads are per-request Server Component
 * reads.
 */
export default async function AdminDashboardPage() {
  const read = createReadClient();
  const auth = await createAuthClient();

  const [seasonsRes, gamesRes, usersRes, claimsRes] = await Promise.all([
    read.from('season').select('*', { count: 'exact', head: true }),
    read.from('game').select('*', { count: 'exact', head: true }),
    auth.rpc('admin_list_users'),
    auth.auth.getClaims(),
  ]);

  const seasons = seasonsRes.count ?? 0;
  const games = gamesRes.count ?? 0;

  const users = usersRes.data ?? [];
  const signedInUsers = users.length;

  const currentUserId =
    typeof claimsRes.data?.claims?.sub === 'string'
      ? claimsRes.data.claims.sub
      : null;

  const admins: AdminRow[] = users
    .filter((u) => u.is_admin)
    .map((u) => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      admin_since: u.admin_since,
    }));
  const addable: AddableUser[] = users
    .filter((u) => !u.is_admin)
    .map((u) => ({ id: u.id, label: u.email }));
  const isLastAdmin = admins.length <= 1;

  const usersError = Boolean(usersRes.error);

  return (
    <section className='flex flex-col gap-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-text text-3xl font-extrabold'>Adminpanel</h1>
      </div>

      <DbOverview
        seasons={seasons}
        games={games}
        signedInUsers={signedInUsers}
        currentSeason={currentSeason}
      />

      {usersError ? (
        <Panel label='Administratorer'>
          <p className='text-accent mt-4 font-mono text-sm' role='alert'>
            Kunne ikke hente brukerlisten.
          </p>
        </Panel>
      ) : (
        <AdminManagement
          admins={admins}
          addable={addable}
          currentUserId={currentUserId}
          isLastAdmin={isLastAdmin}
        />
      )}

      <form action={signOut}>
        <Button type='submit'>Logg ut</Button>
      </form>
    </section>
  );
}
