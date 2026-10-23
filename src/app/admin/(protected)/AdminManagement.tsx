import Panel from '@/components/Panel';
import AddAdminForm, { type AddableUser } from './AddAdminForm';
import RemoveAdminButton from './RemoveAdminButton';

export interface AdminRow {
  id: string;
  email: string;
  display_name: string;
  admin_since: string | null;
}

interface Props {
  admins: AdminRow[];
  addable: AddableUser[];
  currentUserId: string | null;
  isLastAdmin: boolean;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export default function AdminManagement({
  admins,
  addable,
  currentUserId,
  isLastAdmin,
}: Props) {
  return (
    <Panel label='Administratorer'>
      <ul className='mt-4 flex flex-col'>
        {admins.map((admin) => {
          const name = admin.display_name;
          const hasDistinctName = name !== admin.email;
          const isYou = admin.id === currentUserId;
          const since = formatDate(admin.admin_since);

          return (
            <li
              key={admin.id}
              className='border-border flex items-start justify-between gap-4 border-t py-4 first:border-t-0 first:pt-0'
            >
              <div className='flex min-w-0 flex-col gap-0.5'>
                {hasDistinctName ? (
                  <>
                    <span className='text-text truncate text-sm font-semibold'>
                      {name}
                      {isYou ? (
                        <span className='text-text-muted ml-2 font-mono text-xs uppercase'>
                          (deg)
                        </span>
                      ) : null}
                    </span>
                    <span className='text-text-muted truncate font-mono text-xs'>
                      {admin.email}
                    </span>
                  </>
                ) : (
                  <span className='text-text truncate font-mono text-sm'>
                    {admin.email}
                    {isYou ? (
                      <span className='text-text-muted ml-2 text-xs uppercase'>
                        (deg)
                      </span>
                    ) : null}
                  </span>
                )}
                {since ? (
                  <span className='text-text-muted font-mono text-xs'>
                    Lagt til {since}
                  </span>
                ) : null}
              </div>

              <RemoveAdminButton
                userId={admin.id}
                label={hasDistinctName ? name : admin.email}
                isLastAdmin={isLastAdmin}
              />
            </li>
          );
        })}
      </ul>

      <div className='border-border -mx-6 mt-8 border-t sm:-mx-10' />
      <div className='mt-8'>
        <AddAdminForm users={addable} />
      </div>
    </Panel>
  );
}
