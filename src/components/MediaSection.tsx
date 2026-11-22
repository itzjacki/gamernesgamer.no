import { HEADLINE_KINDS, type MediaItemView } from '@/lib/media/view-models';
import { MEDIA_LABELS } from '@/lib/media/labels';
import MediaTile from './MediaTile';
import SectionLabel from './SectionLabel';

interface Props {
  items: MediaItemView[];
  label?: string;
  /** Items that open the section at full width (default: the headline kinds). */
  leadKinds?: MediaItemView['kind'][];
  id?: string;
}

/**
 * A page's media, laid out by shape: lead pieces at full content width,
 * landscape tiles two across, vertical ones (Shorts, tall images) in their
 * own row so they aren't shrunk into 16:9 cells. Renders nothing when empty.
 */
export default function MediaSection({
  items,
  label = MEDIA_LABELS.section,
  leadKinds = [...HEADLINE_KINDS, 'welcome'],
  id = 'content',
}: Props) {
  if (items.length === 0) return null;

  const lead = items.filter((i) => !i.vertical && leadKinds.includes(i.kind));
  const landscape = items.filter(
    (i) => !i.vertical && !leadKinds.includes(i.kind),
  );
  const vertical = items.filter((i) => i.vertical);

  return (
    <section id={id} className='flex flex-col gap-6'>
      <SectionLabel as='h2'>{label}</SectionLabel>
      <MediaGrid lead={lead} landscape={landscape} vertical={vertical} />
    </section>
  );
}

export function MediaGrid({
  lead,
  landscape,
  vertical,
  anchor = false,
}: {
  lead: MediaItemView[];
  landscape: MediaItemView[];
  vertical: MediaItemView[];
  anchor?: boolean;
}) {
  return (
    <div className='flex flex-col gap-10'>
      {lead.map((item) => (
        <MediaTile
          key={item.id}
          item={item}
          anchor={anchor}
          sizes='(min-width: 880px) 800px, 100vw'
        />
      ))}
      {landscape.length > 0 && (
        <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2'>
          {landscape.map((item) => (
            <li key={item.id}>
              <MediaTile item={item} anchor={anchor} />
            </li>
          ))}
        </ul>
      )}
      {vertical.length > 0 && (
        <ul className='grid grid-cols-2 gap-10 sm:grid-cols-4'>
          {vertical.map((item) => (
            <li key={item.id}>
              <MediaTile
                item={item}
                anchor={anchor}
                sizes='(min-width: 640px) 170px, 50vw'
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
