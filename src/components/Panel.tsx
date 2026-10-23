import SectionLabel from './SectionLabel';

interface Props {
  /**
   * An eyebrow, not the heading: callers put their own heading in children,
   * and the first child carries its own top margin (mt-4).
   */
  label?: string;
  as?: 'section' | 'div';
  /** Layout only; the surface is fixed. */
  className?: string;
  children: React.ReactNode;
}

export default function Panel({
  label,
  as: Tag = 'section',
  className = '',
  children,
}: Props) {
  return (
    <Tag className={`border-border bg-bg border p-6 sm:p-10 ${className}`}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      {children}
    </Tag>
  );
}
