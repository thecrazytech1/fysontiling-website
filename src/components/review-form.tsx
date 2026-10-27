import { useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, LoaderCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitReview } from '@/lib/reviews.functions';

export function ReviewForm() {
  const [projectType, setProjectType] = useState('Bathroom tiling');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setState('sending');
    const form = new FormData(event.currentTarget);
    try {
      await submitReview({ data: { name: String(form.get('name') ?? ''), suburb: String(form.get('suburb') ?? ''), review: String(form.get('review') ?? ''), website: String(form.get('website') ?? ''), projectType: projectType as 'Bathroom tiling' | 'Kitchens & splashbacks' | 'Wall & floor tiling' | 'Something else' } });
      setState('sent');
    } catch (e) { setError(e instanceof Error ? e.message : 'Your review could not be sent. Please try again.'); setState('idle'); }
  }
  if (state === 'sent') return <div role="status" className="py-12"><CheckCircle2 className="mb-5 size-10 text-primary"/><h2 className="font-display text-4xl">THANK YOU FOR YOUR KIND WORDS.</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Your review has been received. Shaun reads every one, and it will appear on the website once he has approved it.</p><Button variant="outline" className="mt-7" onClick={() => setState('idle')}>Write another review</Button></div>;
  return <form onSubmit={send} className="grid gap-6"><div className="grid gap-5 sm:grid-cols-2">{[{ name: 'name', label: 'Your name' }, { name: 'suburb', label: 'Your suburb' }].map(f => <div key={f.name} className="grid gap-2"><Label htmlFor={f.name}>{f.label}</Label><Input id={f.name} name={f.name} type="text" required minLength={2} maxLength={120} className="h-12 bg-card" autoComplete={f.name === 'name' ? 'name' : 'address-level2'}/></div>)}</div><div className="grid gap-2"><Label htmlFor="projectType">What did Shaun tile for you?</Label><Select value={projectType} onValueChange={setProjectType}><SelectTrigger id="projectType" className="h-12 w-full bg-card"><SelectValue/></SelectTrigger><SelectContent>{['Bathroom tiling', 'Kitchens & splashbacks', 'Wall & floor tiling', 'Something else'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="review">Your review</Label><Textarea id="review" name="review" required minLength={20} maxLength={1200} rows={5} placeholder="How was the experience? The workmanship, the communication, the finished space…" className="bg-card"/></div><div className="hidden" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={state === 'sending'} className="h-12 w-full rounded-full sm:w-fit sm:px-8">{state === 'sending' ? <><LoaderCircle className="animate-spin"/>Sending…</> : <>Send your review <Star/></>}</Button><p className="text-xs leading-6 text-muted-foreground">Reviews are shared with Shaun first and only published once approved.</p></form>;
}
