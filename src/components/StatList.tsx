interface StatListProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * A motorsport timing-sheet readout: a <dl> of label→value rows with hairline
 * rules between them. Consolidates the stat-row markup from the admin DB
 * overview; the Phase 4 season standings and player stat blocks reuse the same
 * shape.
 *
 * Pass layout spacing (e.g. mt-4 to sit below a Panel eyebrow) via className.
 */
export function StatList({ className = '', children }: StatListProps) {
  return <dl className={`flex flex-col ${className}`.trim()}>{children}</dl>;
}

interface StatRowProps {
  /** Left-aligned label (muted). ReactNode so callers can style it. */
  label: React.ReactNode;
  /** Right-aligned figure (mono, tabular). ReactNode for styled values. */
  value: React.ReactNode;
  className?: string;
}

/**
 * One label→value row inside a StatList. Hairline top border between rows; the
 * first row drops its border and top padding so the list sits flush under
 * whatever precedes it. Baseline-aligned so a large value and its label share a
 * text baseline.
 */
export function StatRow({ label, value, className = '' }: StatRowProps) {
  return (
    <div
      className={`border-border flex items-baseline justify-between gap-4 border-t py-3 first:border-t-0 first:pt-0 ${className}`.trim()}
    >
      <dt className='text-text-muted text-sm'>{label}</dt>
      <dd className='text-text font-mono text-sm tabular-nums'>{value}</dd>
    </div>
  );
}
