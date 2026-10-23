interface StatListProps {
  className?: string;
  children: React.ReactNode;
}

export function StatList({ className = '', children }: StatListProps) {
  return <dl className={`flex flex-col ${className}`.trim()}>{children}</dl>;
}

interface StatRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

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
