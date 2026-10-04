'use client';

import { useState, useTransition } from 'react';
import { addAdmin } from './actions';

export interface AddableUser {
  id: string;
  label: string;
}

interface Props {
  users: AddableUser[];
}

/**
 * Add-admin control: pick an existing signed-in (non-admin) user and promote
 * them. We only ever offer users who already have an auth.users row — there is
 * no email pre-authorization — so the dropdown is the full universe of who can
 * be added. When nobody is addable, we render an explanatory line instead of an
 * empty, confusing select.
 */
export default function AddAdminForm({ users }: Props) {
  const [selected, setSelected] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (users.length === 0) {
    return (
      <p className='text-text-muted text-sm leading-relaxed'>
        Ingen andre innloggede brukere å legge til. En bruker må logge inn med
        Google minst én gang før de kan gjøres til administrator.
      </p>
    );
  }

  function handleSubmit(formData: FormData) {
    const userId = String(formData.get('user_id') ?? '');
    if (!userId) {
      setError('Velg en bruker først.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addAdmin(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setSelected('');
      }
    });
  }

  return (
    <form action={handleSubmit} className='flex flex-col gap-3'>
      <label htmlFor='add-admin' className='text-text-muted text-sm'>
        Legg til administrator
      </label>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <select
          id='add-admin'
          name='user_id'
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={isPending}
          className='border-border bg-surface text-text focus-visible:outline-accent h-11 w-full border px-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:max-w-xs'
        >
          <option value='' disabled>
            Velg en bruker …
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>

        <button
          type='submit'
          disabled={isPending || !selected}
          className='border-border bg-surface text-text hover:border-accent focus-visible:outline-accent active:bg-bg flex h-11 items-center justify-center border px-6 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50'
        >
          {isPending ? 'Legger til …' : 'Legg til'}
        </button>
      </div>

      {error ? (
        <span className='text-accent font-mono text-xs' role='alert'>
          {error}
        </span>
      ) : null}
    </form>
  );
}
