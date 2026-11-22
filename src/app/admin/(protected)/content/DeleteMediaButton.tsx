'use client';

import { useState, useTransition } from 'react';
import { deleteMedia } from './actions';

interface Props {
  id: string;
  /** For the confirm() prompt. */
  title: string;
}

export default function DeleteMediaButton({ id, title }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (
      !window.confirm(
        `Slette «${title}»? Det forsvinner fra siden med en gang.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteMedia(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className='flex flex-col items-end gap-1'>
      <button
        type='button'
        onClick={handleDelete}
        disabled={isPending}
        className='text-text-muted hover:text-text-accent focus-visible:text-text-accent focus-visible:outline-accent -m-2 p-2 font-mono text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50'
      >
        {isPending ? 'Sletter …' : 'Slett'}
      </button>
      {error ? (
        <span className='text-text-accent font-mono text-xs' role='alert'>
          {error}
        </span>
      ) : null}
    </div>
  );
}
