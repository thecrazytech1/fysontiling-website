import { createFileRoute } from '@tanstack/react-router';
import { Quote } from 'lucide-react';
import { ReviewForm } from '@/components/review-form';
import { listApprovedReviews } from '@/lib/reviews.functions';
import { pageHead } from '@/lib/site-data';

export const Route = createFileRoute('/reviews')({
  staticData: { sitemap: true },
  loader: () => listApprovedReviews(),
  head: () => pageHead('Reviews', 'Read what Mornington Peninsula homeowners say about Fyson Tiling, or leave your own review of Shaun’s work.', '/reviews'),
  component: ReviewsPage,
});

function ReviewsPage() {
  const reviews = Route.useLoaderData();
  const details = (r: (typeof reviews)[number]) => [r.suburb, r.project_type].filter(Boolean).join(' · ');
  return <>
    <section className="site-width py-14 md:py-20">
      <p className="eyebrow mb-3 text-primary">From the community</p>
      <h1 className="font-display text-5xl md:text-7xl">KIND WORDS.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Genuine reviews from homeowners across the Mornington Peninsula and surrounds. Had Shaun tile your place? Your words would mean a lot — share them below.</p>
    </section>
    {reviews.length > 0 && <section className="site-width grid gap-5 pb-14 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map(r => <figure key={r.id} className="rounded-2xl border border-border bg-card p-6">
        <Quote className="mb-4 size-6 text-primary"/>
        <blockquote className="text-sm leading-7">{r.review}</blockquote>
        <figcaption className="mt-5 text-xs text-muted-foreground"><span className="font-medium text-foreground">{r.name}</span>{details(r) && <> · {details(r)}</>}</figcaption>
      </figure>)}
    </section>}
    <section className="border-t border-border bg-card/40 py-14 md:py-20">
      <div className="site-width max-w-2xl">
        <p className="eyebrow mb-3 text-primary">Leave a review</p>
        <h2 className="font-display text-4xl md:text-5xl">TELL US HOW IT WENT.</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">Your review goes to Shaun first and appears here once approved.</p>
        <div className="mt-8"><ReviewForm/></div>
      </div>
    </section>
  </>;
}
