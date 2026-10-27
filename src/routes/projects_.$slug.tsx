import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectStory } from '@/components/project-story';
import { ProjectCTA } from '@/components/site-sections';
import { pageHead, projects } from '@/lib/site-data';

export const Route = createFileRoute('/projects_/$slug')({
  staticData: { sitemap: true },
  loader: ({ params }) => {
    const project = projects.find(item => item.slug === params.slug);
    if (!project) throw notFound();
    return project;
  },
  head: ({ params, loaderData }) => {
    const path = `/projects/${params.slug}`;
    if (!loaderData) {
      const missing = pageHead('Project unavailable', 'This Fyson Tiling project could not be found.', path);
      return { ...missing, meta: [...missing.meta, { name: 'robots', content: 'noindex' }] };
    }
    const head = pageHead(loaderData.title, `Explore the ${loaderData.title} by Fyson Tiling${loaderData.publication ? `, featured in ${loaderData.publication}` : ''}.`, path, 'article');
    const image = loaderData.featureImage;
    return { ...head, meta: [...head.meta, ...(image?.startsWith('https://') ? [{ property: 'og:image', content: image }, { name: 'twitter:image', content: image }] : [])] };
  },
  component: ProjectPage,
});

function ProjectPage() {
  const project = Route.useLoaderData();
  return <>
    <section className="border-b border-border py-10 md:py-14"><div className="site-width">
      <Button asChild variant="link" className="mb-5 px-0"><Link to="/projects"><ArrowLeft/>All projects</Link></Button>
      <p className="eyebrow mb-3 text-primary">{project.publication ? `Featured in ${project.publication}` : 'Fyson Tiling'}</p><h1 className="page-title break-words">{project.title}</h1>
    </div></section>
    <section className="py-10 md:py-14"><div className="site-width"><ProjectStory title={project.title} publication={project.publication} pages={project.pages} magazinePages={project.magazinePages}/></div></section>
    <ProjectCTA/>
  </>;
}