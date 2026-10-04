import SectionLabel from './SectionLabel';

interface Props {
  /**
   * Optional mono eyebrow rendered at the top of the panel via SectionLabel.
   * The panel owns the eyebrow but NOT the heading — callers supply their own
   * <h1>/<h2> inside children when a heading is needed.
   */
  label?: string;
  /** Semantic wrapper element. Defaults to 'section'. */
  as?: 'section' | 'div';
  /** Layout-only extra classes (e.g. mx-auto max-w-md). Surface is fixed. */
  className?: string;
  children: React.ReactNode;
}

/**
 * The VERKSTED bordered surface: a solid `bg-bg` panel with hairline borders
 * that masks the grid rather than floating above it (no shadow, no radius).
 * Consolidates the `border-border bg-bg border p-6 sm:p-10` markup that was
 * duplicated across the admin dashboard, admin management, the rejection
 * screen, and the login page.
 *
 * When `label` is set, a SectionLabel eyebrow renders at the top; the first
 * content child carries its own top margin (mt-4) so the eyebrow-to-body gap
 * matches the original markup exactly.
 */
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
