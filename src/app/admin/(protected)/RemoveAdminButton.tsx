'use client';

import { useState, useTransition } from 'react';
import { removeAdmin } from './actions';

interface Props {
  userId: string;
  /** For the confirm() prompt. */
  label: string;
  isLastAdmin: boolean;
}

/**
 * A text button: the bordered Button is for forward actions. For the last
 * admin it is disabled with a visible reason, so the DB's guard is explained.
 */
export default function RemoveAdminButton({
  userId,
  label,
  isLastAdmin,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isLastAdmin) {
    return (
      <span
        className='text-text-muted/60 font-mono text-xs'
        aria-disabled='true'
      >
        Siste administrator kan ikke fjernes.
      </span>
    );
  }

  function handleRemove() {
    if (!window.confirm(`Fjerne ${label} som administrator?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await removeAdmin(userId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className='flex flex-col items-end gap-1'>
      <button
        type='button'
        onClick={handleRemove}
        disabled={isPending}
        className='text-text-muted hover:text-accent focus-visible:text-accent focus-visible:outline-accent -m-2 p-2 font-mono text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50'
      >
        {isPending ? 'Fjerner …' : 'Fjern'}
      </button>
      {error ? (
        <span className='text-accent font-mono text-xs' role='alert'>
          {error}
        </span>
      ) : null}
    </div>
  );
}
