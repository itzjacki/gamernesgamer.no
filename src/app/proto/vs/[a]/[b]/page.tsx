import { redirect } from 'next/navigation';

// PROTOTYPE — stands in for the real two-slug pair page; forwards to it.

export default async function ProtoPairPage({
  params,
}: PageProps<'/proto/vs/[a]/[b]'>) {
  const { a, b } = await params;
  redirect(`/vs/${a}/${b}`);
}
