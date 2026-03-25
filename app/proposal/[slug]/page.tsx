import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FlipbookWrapper from './FlipbookWrapper';

async function getProposal(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proposal/${slug}/api`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const data = await getProposal(params.slug);
  
  if (!data?.data) {
    return { title: 'Proposal Tidak Ditemukan' };
  }

  const proposal = data.data;
  const title = `${proposal.judul} - Proposal Kegiatan`;
  const description = proposal.deskripsi || 'Sponsorship dan informasi lengkap mengenai event ini.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: proposal.cover_url ? [{ url: proposal.cover_url }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: proposal.cover_url ? [proposal.cover_url] : [],
    },
  };
}

export default async function ProposalPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = await getProposal(params.slug);

  if (!data?.data) {
    notFound();
  }

  return (
    <main className="fixed inset-0 overflow-hidden">
      <FlipbookWrapper proposal={data.data} />
    </main>
  );
}
