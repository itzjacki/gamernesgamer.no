'use client';

import { useState, useTransition } from 'react';
import { removeAdmin } from './actions';

interface Props {
  userId: string;
  /** Display name/email, used in the confirm() prompt. */
  label: string;
  /** When true, removal is blocked (only one admin left) — render a reason. */
  isLastAdmin: boolean;
}

/**
 * Remove control for a single admin row. A muted-mono text button (the heavy
 * bordered button is reserved for forward actions like "Legg til"); it turns
 * accent on hover/focus — a legitimate accent-on-interaction "stop" moment.
 *
 * When this is the last admin, the control is a dimmed, non-interactive span
 * plus a persistent visible reason, so the lockout guard is explained in the UI
 * (not just enforced in the DB).
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
