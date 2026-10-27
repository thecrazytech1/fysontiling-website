import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

const reviewSchema = z.object({
  name: z.string().trim().min(2).max(120),
  suburb: z.string().trim().min(2).max(120),
  projectType: z.enum(['Bathroom tiling', 'Kitchens & splashbacks', 'Wall & floor tiling', 'Something else']),
  review: z.string().trim().min(20).max(1200),
  website: z.string().max(0),
});

export const submitReview = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    // Narrow public intake: validation + honeypot + per-name limit. Reviews stay private until approved.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const name = data.name.toLowerCase();
    const { count, error: countError } = await supabaseAdmin.from('testimonials').select('id', { count: 'exact', head: true }).ilike('name', name).gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if (countError) throw new Error('Your review could not be sent. Please try again shortly.');
    if ((count ?? 0) >= 2) throw new Error('You have already sent a review recently. Please try again in an hour.');
    const { error } = await supabaseAdmin.from('testimonials').insert({ name: data.name, suburb: data.suburb, project_type: data.projectType, review: data.review });
    if (error) throw new Error('Your review could not be sent. Please try again shortly.');
    return { success: true };
  });

export const listApprovedReviews = createServerFn({ method: 'GET' }).handler(async () => {
  // Public read of approved reviews only, through the publishable key and the anon SELECT policy.
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  const supabasePublic = createClient<Database>(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
      h.set('apikey', key);
      return fetch(input, { ...init, headers: h });
    } },
  });
  const { data } = await supabasePublic.from('testimonials').select('id, name, suburb, project_type, review, created_at').eq('approved', true).order('created_at', { ascending: false }).limit(12);
  return data ?? [];
});
