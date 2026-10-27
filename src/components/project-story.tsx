import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { photoDescriptions } from '@/lib/site-data';

export function ProjectStory({ title, publication, pages, magazinePages = pages.length }: { title: string; publication: string; pages: string[]; magazinePages?: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const label = (index: number) => (index < magazinePages ? 'feature page' : 'project photo');
  const source = (index: number) => (index < magazinePages && publication ? `${publication} · ` : '');
  const caption = (image: string, index: number) => photoDescriptions[image] ?? `${label(index)} ${index + 1}`;
  const current = selected === null ? undefined : pages[selected];
  return <>
    <div className="space-y-10">
      {pages.map((image, index) => <figure key={image} className="mx-auto w-fit max-w-full">
        <img src={image} alt={photoDescriptions[image] ?? `${title} — ${source(index)}${label(index)} ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="mx-auto block max-h-[900px] w-auto max-w-full"/>
        <figcaption className="mt-3 border-b border-border pb-4">
          <p className="mb-3 max-w-prose text-sm leading-7 text-muted-foreground">{caption(image, index)}</p>
          <div className="flex items-center justify-between gap-4">
            {(source(index) || pages.length > 1) && <span className="eyebrow text-muted-foreground">{source(index)}{index + 1} / {pages.length}</span>}
            <Button variant="outline" size="sm" className="ml-auto shrink-0 rounded-full" onClick={() => setSelected(index)}><Maximize2/>View full size</Button>
          </div>
        </figcaption>
      </figure>)}
    </div>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="max-w-6xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{current ? caption(current, selected ?? 0) : ''}</DialogDescription>
        <div className="max-h-[75svh] overflow-auto">
          {current && <img src={current} alt={caption(current, selected ?? 0)} className="w-auto max-w-none"/>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
