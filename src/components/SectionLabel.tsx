interface Props {
  children: React.ReactNode;
}

export default function SectionLabel({ children }: Props) {
  return (
    <p className='text-text-muted font-mono text-xs tracking-widest uppercase'>
      {children}
    </p>
  );
}
