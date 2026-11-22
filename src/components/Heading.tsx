import CatalogueLine from './CatalogueLine';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingElement = HeadingLevel | 'div' | 'span';

interface Props {
  as: HeadingElement;
  styleAs?: HeadingLevel;
  /** The catalogue line's parts after GG (design.md, Notation). */
  serial?: React.ReactNode[];
  children: React.ReactNode;
  className?: string;
}

const styleMap: Record<HeadingLevel, string> = {
  h1: 'text-4xl font-extrabold tracking-tight uppercase sm:text-5xl lg:text-7xl',
  h2: 'text-3xl font-extrabold tracking-tight uppercase sm:text-4xl',
  h3: 'text-2xl font-extrabold tracking-tight uppercase',
  h4: 'text-xl font-extrabold tracking-tight uppercase',
  h5: 'text-lg font-semibold tracking-tight uppercase',
  h6: 'text-base font-semibold tracking-tight uppercase',
};

export default function Heading({
  as: Tag,
  styleAs,
  serial,
  children,
  className = '',
}: Props) {
  const level: HeadingLevel =
    styleAs ?? (Tag === 'div' || Tag === 'span' ? 'h2' : (Tag as HeadingLevel));

  return (
    <div className='flex flex-col gap-1'>
      {serial && <CatalogueLine parts={serial} />}
      <Tag className={`text-text ${styleMap[level]} ${className}`}>
        {children}
      </Tag>
    </div>
  );
}
