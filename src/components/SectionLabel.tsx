interface Props {
  children: React.ReactNode;
  /** A section's label can be its heading. */
  as?: 'p' | 'h2' | 'h3';
}

export default function SectionLabel({ children, as: Tag = 'p' }: Props) {
  return (
    <Tag className='text-text-muted font-mono text-xs tracking-widest uppercase'>
      {children}
    </Tag>
  );
}
