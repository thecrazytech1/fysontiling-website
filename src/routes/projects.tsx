import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCTA } from '@/components/site-sections';
import { pageHead } from '@/lib/site-data';
import { T, useSiteContent } from '@/lib/site-content';

export const Route = createFileRoute('/projects')({
  staticData: { sitemap: true },
  head: () => pageHead('Our projects', 'Bathroom, kitchen and floor tiling projects across the Mornington Peninsula by Fyson Tiling, including homes featured in Home Beautiful and Australian House & Garden.', '/projects'),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects } = useSiteContent();
  return <>
    <section className="border-b border-border py-14 md:py-20"><div className="site-width"><p className="eyebrow mb-3 text-primary">Fyson Tiling</p><h1 className="page-title"><T k="projectsPage.title"/></h1><p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground"><T k="projectsPage.intro"/></p></div></section>
    <section className="py-12 md:py-16"><div className="site-width grid gap-10 md:grid-cols-2">
      {projects.map(project => <article key={project.slug} className="min-w-0">
        <Link to="/projects/$slug" params={{ slug: project.slug }} aria-label={`Explore ${project.title}`} className="block overflow-hidden rounded-md bg-secondary"><img src={project.cover} alt={project.publication ? `${project.title} in ${project.publication}` : `${project.title} by Fyson Tiling`} style={{ objectPosition: project.coverFocus }} className="aspect-[4/3] w-full object-cover"/></Link>
        <p className="eyebrow mt-5 text-primary">{project.publication || 'Fyson Tiling'}</p><h2 className="mt-2 font-display text-3xl">{project.title}</h2>
        <Button asChild variant="outline" className="mt-5 rounded-full"><Link to="/projects/$slug" params={{ slug: project.slug }}>Explore project <ArrowUpRight/></Link></Button>
      </article>)}
    </div></section>
    <ProjectCTA/>
  </>;
}