import Link from 'next/link';

type Width = 'full' | 'responsive' | 'fit';

const BASE =
  'border-border bg-surface text-text hover:border-accent focus-visible:outline-accent active:bg-bg flex h-11 items-center justify-center border px-6 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';

const WIDTH: Record<Width, string> = {
  full: 'w-full',
  responsive: 'w-full sm:w-fit',
  fit: 'w-fit',
};

interface CommonProps {
  width?: Width;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton extends CommonProps {
  as?: 'button';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

interface ButtonAsAnchor extends CommonProps {
  as: 'a';
  href: string;
}

interface ButtonAsLink extends CommonProps {
  as: 'link';
  href: string;
}

type Props = ButtonAsButton | ButtonAsAnchor | ButtonAsLink;

/**
 * The VERKSTED action control: an h-11 (44px touch target) bordered surface
 * that gains an accent border on hover/focus. Consolidates the button markup
 * duplicated across the admin dashboard, admin management, and the rejection
 * screen, and serves both real buttons and button-styled links from one place.
 *
 * Polymorphic via a discriminated `as` prop ('button' | 'a' | 'link') rather
 * than asChild/cloneElement, so it stays a plain Server Component over a fixed,
 * known set of elements. Interactive pending state (useFormStatus) deliberately
 * lives OUTSIDE this primitive — a thin client wrapper passes `disabled` in
 * (see GoogleSignInButton), keeping Button itself server-rendered.
 */
export default function Button(props: Props) {
  const width = props.width ?? 'fit';
  const className = `${BASE} ${WIDTH[width]} ${props.className ?? ''}`.trim();

  if (props.as === 'a') {
    return (
      <a href={props.href} className={className}>
        {props.children}
      </a>
    );
  }

  if (props.as === 'link') {
    return (
      <Link href={props.href} className={className}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      className={className}
    >
      {props.children}
    </button>
  );
}
