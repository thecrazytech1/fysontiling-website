import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import {
  deleteFaq,
  deletePhoto,
  deleteProject,
  getAdminContent,
  resetText,
  saveFaq,
  saveOrder,
  saveProject,
  saveText,
  setProjectCover,
  updatePhoto,
  uploadPhoto,
} from "@/lib/content.functions";
import { galleryCategories } from "@/lib/site-content";
import { textDefaults, type TextKey } from "@/lib/site-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdminContent = Awaited<ReturnType<typeof getAdminContent>>;
type AdminProject = AdminContent["projects"][number];
type AdminPhoto = AdminContent["photos"][number];
type Category = (typeof galleryCategories)[number];
type Focus = "center" | "center top" | "center bottom";

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
const contentKey = ["admin", "content"] as const;
const notInGallery = "none";
const focusOptions: Array<[Focus, string]> = [
  ["center", "Middle"],
  ["center top", "Top"],
  ["center bottom", "Bottom"],
];
const asFocus = (value: string): Focus =>
  value === "top" || value === "center top"
    ? "center top"
    : value === "bottom" || value === "center bottom"
      ? "center bottom"
      : "center";
const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Returns ids with the item at `index` swapped one place up (-1) or down (+1).
function moved(ids: string[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function useAdminContent() {
  return useQuery({ queryKey: contentKey, queryFn: () => getAdminContent() });
}

// Every edit refreshes the admin lists and the site content this browser has cached.
function useEdit<T>(fn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: fn,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: contentKey });
      await router.invalidate();
    },
  });
}

function ErrorLine({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errorText(error)}
    </p>
  );
}

function Loading() {
  return <LoaderCircle className="animate-spin text-muted-foreground" />;
}

function MoveButtons({
  index,
  count,
  onMove,
  disabled,
}: {
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Move up"
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Move down"
        disabled={disabled || index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- photo upload

// Phone photos are often 5–10 MB; shrink them in the browser so pages stay fast.
async function shrinkPhoto(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`“${file.name}” couldn't be opened. Try saving it as a JPEG first.`);
  }
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't prepare photos for upload.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error(`“${file.name}” couldn't be prepared for upload.`);
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
}

function PhotoUploader({
  projectId,
  requireCategory,
}: {
  projectId: string | null;
  requireCategory?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>(requireCategory ? "" : notInGallery);
  const [progress, setProgress] = useState("");
  const upload = useEdit(async (files: File[]) => {
    for (const [index, file] of files.entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}…`);
      const form = new FormData();
      form.set("file", await shrinkPhoto(file));
      form.set("projectId", projectId ?? "");
      form.set("category", category === notInGallery ? "" : category);
      form.set("caption", "");
      await uploadPhoto({ data: form });
    }
  });
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length > 0) upload.mutate(files, { onSettled: () => setProgress("") });
  }
  const ready = !requireCategory || category !== "";
  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label>{requireCategory ? "Gallery category" : "Also show in the gallery as"}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-56 bg-background">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {!requireCategory && <SelectItem value={notInGallery}>Not in the gallery</SelectItem>}
              {galleryCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={choose}
        />
        <Button
          disabled={!ready || upload.isPending}
          onClick={() => input.current?.click()}
          className="rounded-full"
        >
          {upload.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
          {upload.isPending ? progress : "Add photos"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        You can pick several photos at once. They're resized automatically. Add a caption to each
        afterwards, describing the tiles: colour, layout and finish. Captions show on the site and
        help Google.
      </p>
      <ErrorLine error={upload.error} />
    </div>
  );
}

// ---------------------------------------------------------------- photo card

function PhotoCard({
  photo,
  index,
  count,
  onMove,
  moving,
  mode,
  isCover,
  onSetCover,
  projectTitle,
}: {
  photo: AdminPhoto;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  moving: boolean;
  mode: "project" | "gallery";
  isCover?: boolean;
  onSetCover?: () => void;
  projectTitle?: string | undefined;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const [category, setCategory] = useState(photo.category ?? notInGallery);
  const [magazinePage, setMagazinePage] = useState(photo.magazine_page);
  const [focus, setFocus] = useState<Focus>(asFocus(photo.focus));
  const save = useEdit(updatePhoto);
  const remove = useEdit(deletePhoto);
  const dirty =
    caption !== photo.caption ||
    category !== (photo.category ?? notInGallery) ||
    magazinePage !== photo.magazine_page ||
    focus !== asFocus(photo.focus);
  const fields = (overrides: { category?: string; categoryCover?: boolean } = {}) => {
    const chosen = overrides.category ?? category;
    return {
      id: photo.id,
      caption,
      category: chosen === notInGallery ? null : (chosen as Category),
      magazinePage,
      // A cover moved to another category stops being a cover.
      categoryCover: overrides.categoryCover ?? (photo.category_cover && chosen === photo.category),
      focus,
    };
  };
  // A gallery-only photo has nowhere else to live, so removing it deletes it; a project
  // photo just leaves the gallery.
  const removeFromGallery = mode === "gallery" && photo.project_id !== null;

  return (
    <article className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[180px_1fr]">
      <a href={photo.url} target="_blank" rel="noreferrer" className="block">
        <img
          src={photo.url}
          alt={photo.caption}
          loading="lazy"
          style={{ objectPosition: focus }}
          className="aspect-[4/3] w-full rounded-md bg-secondary object-cover"
        />
      </a>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {mode === "project" && isCover && <Badge>Cover photo</Badge>}
          {mode === "project" && magazinePage && <Badge variant="outline">Magazine page</Badge>}
          {mode === "gallery" && photo.category_cover && <Badge>Category cover</Badge>}
          {mode === "gallery" && (
            <span className="text-xs text-muted-foreground">
              {projectTitle ? `From ${projectTitle}` : "Gallery only"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <MoveButtons index={index} count={count} onMove={onMove} disabled={moving} />
            <Button
              variant="ghost"
              size="icon"
              aria-label={removeFromGallery ? "Remove from gallery" : "Delete photo"}
              title={removeFromGallery ? "Remove from gallery" : "Delete photo"}
              onClick={() => {
                if (removeFromGallery) {
                  if (confirm("Take this photo out of the gallery? It stays in its project."))
                    save.mutate({ data: fields({ category: notInGallery, categoryCover: false }) });
                } else if (confirm("Delete this photo from the website?")) {
                  remove.mutate({ data: { id: photo.id } });
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={400}
          rows={2}
          placeholder="Describe the tiles: colour, layout, finish…"
          className="bg-background"
          aria-label="Caption"
        />
        <div className="flex flex-wrap items-center gap-3">
          {!magazinePage && (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48 bg-background" aria-label="Gallery category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mode === "project" && (
                  <SelectItem value={notInGallery}>Not in the gallery</SelectItem>
                )}
                {galleryCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    Gallery: {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {mode === "gallery" && (
            <Select value={focus} onValueChange={(v) => setFocus(v as Focus)}>
              <SelectTrigger className="w-40 bg-background" aria-label="Crop">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {focusOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    Crop: {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {mode === "project" && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={magazinePage} onCheckedChange={setMagazinePage} />
              Magazine page
            </label>
          )}
          {mode === "project" && !isCover && !magazinePage && onSetCover && (
            <Button variant="outline" size="sm" onClick={onSetCover}>
              <Star /> Make cover
            </Button>
          )}
          {mode === "gallery" && !photo.category_cover && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => save.mutate({ data: fields({ categoryCover: true }) })}
            >
              <Star /> Use as {photo.category} cover
            </Button>
          )}
          <Button
            size="sm"
            className="ml-auto"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate({ data: fields() })}
          >
            {save.isPending ? <LoaderCircle className="animate-spin" /> : "Save"}
          </Button>
        </div>
        <ErrorLine error={save.error ?? remove.error} />
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- projects

export function ProjectsAdmin() {
  const content = useAdminContent();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const reorder = useEdit(saveOrder);
  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorLine error={content.error} />;
  const { projects, photos } = content.data;

  if (editing !== null) {
    const project = projects.find((p) => p.id === editing) ?? null;
    return (
      <ProjectEditor
        key={editing}
        project={project}
        photos={photos.filter((p) => p.project_id === project?.id)}
        onDone={(id) => setEditing(id)}
      />
    );
  }
  const ids = projects.map((p) => p.id);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Projects show in this order on the site. The first three appear on the home page.
        </p>
        <Button onClick={() => setEditing("new")} className="rounded-full">
          <Plus /> Add a project
        </Button>
      </div>
      <ErrorLine error={reorder.error} />
      {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      {projects.map((project, index) => {
        const projectPhotos = photos.filter((p) => p.project_id === project.id);
        const cover =
          projectPhotos.find((p) => p.id === project.cover_photo_id) ??
          projectPhotos.find((p) => !p.magazine_page) ??
          projectPhotos[0];
        return (
          <article
            key={project.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            {cover ? (
              <img
                src={cover.url}
                alt=""
                className="aspect-[4/3] w-28 rounded-md object-cover"
                style={{ objectPosition: project.cover_focus }}
              />
            ) : (
              <div className="aspect-[4/3] w-28 rounded-md bg-secondary" />
            )}
            <div className="min-w-0 grow">
              <h3 className="text-lg font-medium">
                {project.title}{" "}
                {!project.published && (
                  <Badge variant="outline" className="ml-1 align-middle">
                    Hidden
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {projectPhotos.length} photo{projectPhotos.length === 1 ? "" : "s"}
                {project.publication && ` · ${project.publication}`}
              </p>
            </div>
            <MoveButtons
              index={index}
              count={projects.length}
              disabled={reorder.isPending}
              onMove={(d) =>
                reorder.mutate({ data: { list: "projects", ids: moved(ids, index, d) } })
              }
            />
            <Button variant="outline" onClick={() => setEditing(project.id)}>
              Edit
            </Button>
          </article>
        );
      })}
    </div>
  );
}

function ProjectEditor({
  project,
  photos,
  onDone,
}: {
  project: AdminProject | null;
  photos: AdminPhoto[];
  onDone: (id: string | null) => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(project !== null);
  const [publication, setPublication] = useState(project?.publication ?? "");
  const [intro, setIntro] = useState(project?.intro ?? "");
  const [published, setPublished] = useState(project?.published ?? false);
  const [coverFocus, setCoverFocus] = useState<Focus>(asFocus(project?.cover_focus ?? "center"));
  const save = useEdit(saveProject);
  const remove = useEdit(deleteProject);
  const reorder = useEdit(saveOrder);
  const cover = useEdit(setProjectCover);
  const shownSlug = slugTouched ? slug : slugify(title);

  // Magazine pages always lead the project page, so order them first here too.
  const ordered = useMemo(
    () =>
      [...photos].sort(
        (a, b) => Number(b.magazine_page) - Number(a.magazine_page) || a.sort_order - b.sort_order,
      ),
    [photos],
  );
  const ids = ordered.map((p) => p.id);
  const coverId =
    project?.cover_photo_id ?? ordered.find((p) => !p.magazine_page)?.id ?? ordered[0]?.id;

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate(
      {
        data: {
          ...(project ? { id: project.id } : {}),
          slug: shownSlug,
          title,
          publication,
          intro,
          coverFocus,
          published,
        },
      },
      { onSuccess: (result) => !project && onDone((result as { id: string }).id) },
    );
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="link" className="px-0" onClick={() => onDone(null)}>
          <ArrowLeft /> All projects
        </Button>
        {project?.published && (
          <Button asChild variant="outline" size="sm">
            <Link to="/projects/$slug" params={{ slug: project.slug }} target="_blank">
              View on the website <ExternalLink />
            </Link>
          </Button>
        )}
      </div>
      <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-3xl">{project ? "EDIT PROJECT." : "NEW PROJECT."}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="project-title">Project name</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="e.g. Sorrento Project"
              className="h-12 bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-slug">Web address</Label>
            <Input
              id="project-slug"
              value={shownSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              required
              className="h-12 bg-background"
            />
            <p className="text-xs text-muted-foreground">
              fysontiling.com.au/projects/{shownSlug || "…"}
              {project &&
                shownSlug !== project.slug &&
                " · changing this breaks links already shared"}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-publication">Magazine it appeared in (optional)</Label>
            <Input
              id="project-publication"
              value={publication}
              onChange={(e) => setPublication(e.target.value)}
              maxLength={120}
              className="h-12 bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label>Cover photo crop</Label>
            <Select value={coverFocus} onValueChange={(v) => setCoverFocus(v as Focus)}>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {focusOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    Keep the {label.toLowerCase()} of the photo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="project-intro">About this project (optional)</Label>
          <Textarea
            id="project-intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Where it is, what was tiled, the tiles chosen… Shown under the project name and used by Google."
            className="bg-background"
          />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={published} onCheckedChange={setPublished} />
          {published
            ? "Shown on the website"
            : "Hidden from the website — switch on once the photos are in"}
        </label>
        <ErrorLine error={save.error ?? remove.error} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending} className="rounded-full px-8">
            {save.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : project ? (
              "Save"
            ) : (
              "Create project"
            )}
          </Button>
          {project && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              disabled={remove.isPending}
              onClick={() =>
                confirm(`Delete “${project.title}” and all ${photos.length} of its photos?`) &&
                remove.mutate({ data: { id: project.id } }, { onSuccess: () => onDone(null) })
              }
            >
              <Trash2 /> Delete project
            </Button>
          )}
        </div>
      </form>

      {project ? (
        <section className="grid gap-4">
          <h2 className="font-display text-3xl">PHOTOS.</h2>
          <PhotoUploader projectId={project.id} />
          <ErrorLine error={reorder.error ?? cover.error} />
          {ordered.map((photo, index) => (
            <PhotoCard
              key={`${photo.id}-${photo.caption}-${photo.category}-${photo.magazine_page}`}
              photo={photo}
              index={index}
              count={ordered.length}
              moving={reorder.isPending}
              onMove={(d) =>
                reorder.mutate({ data: { list: "project-photos", ids: moved(ids, index, d) } })
              }
              mode="project"
              isCover={photo.id === coverId}
              onSetCover={() =>
                cover.mutate({ data: { projectId: project.id, photoId: photo.id } })
              }
            />
          ))}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Create the project first, then add its photos.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- gallery

export function GalleryAdmin() {
  const content = useAdminContent();
  const [filter, setFilter] = useState<Category | "All">("All");
  const reorder = useEdit(saveOrder);
  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorLine error={content.error} />;
  const { photos, projects } = content.data;
  const titles = new Map(projects.map((p) => [p.id, p.title]));
  const gallery = photos
    .filter((p) => p.category && !p.magazine_page)
    .sort((a, b) => a.gallery_order - b.gallery_order);
  const shown = gallery.filter((p) => filter === "All" || p.category === filter);
  const allIds = gallery.map((p) => p.id);

  // Moving within a filtered list swaps with the neighbour in that category.
  function move(photo: AdminPhoto, direction: -1 | 1) {
    const neighbour = shown[shown.indexOf(photo) + direction];
    if (!neighbour) return;
    const ids = [...allIds];
    const a = ids.indexOf(photo.id);
    const b = ids.indexOf(neighbour.id);
    [ids[a], ids[b]] = [ids[b]!, ids[a]!];
    reorder.mutate({ data: { list: "gallery", ids } });
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        The inspiration gallery shows these photos in this order. Project photos appear here when
        they have a gallery category. Each category's cover photo is the one shown on the home page.
      </p>
      <PhotoUploader projectId={null} requireCategory />
      <div className="flex flex-wrap gap-2">
        {(["All", ...galleryCategories] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={filter === c ? "default" : "outline"}
            onClick={() => setFilter(c)}
          >
            {c} ({c === "All" ? gallery.length : gallery.filter((p) => p.category === c).length})
          </Button>
        ))}
      </div>
      <ErrorLine error={reorder.error} />
      {shown.map((photo, index) => (
        <PhotoCard
          key={`${photo.id}-${photo.caption}-${photo.category}-${photo.focus}`}
          photo={photo}
          index={index}
          count={shown.length}
          moving={reorder.isPending}
          onMove={(d) => move(photo, d)}
          mode="gallery"
          projectTitle={photo.project_id ? titles.get(photo.project_id) : undefined}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- page text

export function TextAdmin() {
  const content = useAdminContent();
  const [search, setSearch] = useState("");
  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorLine error={content.error} />;
  const saved = new Map(content.data.text.map((t) => [t.key, t.value]));
  const query = search.trim().toLowerCase();
  const keys = (Object.keys(textDefaults) as TextKey[]).filter((key) => {
    if (!query) return true;
    const field = textDefaults[key];
    return [field.group, field.label, field.value, saved.get(key) ?? ""].some((s) =>
      s.toLowerCase().includes(query),
    );
  });
  const groups = [...new Set(keys.map((key) => textDefaults[key].group))];
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">
          Edit the wording on each page. In headings, press Enter to start a new line. “Back to
          original” restores the wording the site launched with.
        </p>
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the text, e.g. “20 years”"
          className="h-12 max-w-md bg-card"
        />
      </div>
      {groups.map((group) => (
        <section key={group} className="grid gap-4">
          <h2 className="font-display text-2xl">{group}</h2>
          {keys
            .filter((key) => textDefaults[key].group === group)
            .map((key) => (
              <TextField
                key={`${key}-${saved.get(key) ?? ""}`}
                textKey={key}
                saved={saved.get(key)}
              />
            ))}
        </section>
      ))}
    </div>
  );
}

function TextField({ textKey, saved }: { textKey: TextKey; saved: string | undefined }) {
  const field = textDefaults[textKey];
  const current = saved ?? field.value;
  const [value, setValue] = useState(current);
  const save = useEdit(saveText);
  const reset = useEdit(resetText);
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={textKey}>{field.label}</Label>
        {saved !== undefined && <Badge variant="outline">Edited</Badge>}
      </div>
      <Textarea
        id={textKey}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={Math.min(8, Math.max(field.heading ? 2 : 2, Math.ceil(value.length / 90)))}
        maxLength={3000}
        className={`bg-background ${field.heading ? "font-display text-xl" : ""}`}
      />
      <ErrorLine error={save.error ?? reset.error} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={value.trim() === "" || value === current || save.isPending}
          onClick={() => save.mutate({ data: { key: textKey, value } })}
        >
          {save.isPending ? <LoaderCircle className="animate-spin" /> : "Save"}
        </Button>
        {value !== current && (
          <Button size="sm" variant="ghost" onClick={() => setValue(current)}>
            Undo changes
          </Button>
        )}
        {saved !== undefined && (
          <Button
            size="sm"
            variant="ghost"
            disabled={reset.isPending}
            onClick={() =>
              confirm(`Put this back to the original wording?\n\n“${field.value}”`) &&
              reset.mutate({ data: { key: textKey } })
            }
          >
            <RotateCcw /> Back to original
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- FAQs

export function FaqsAdmin() {
  const content = useAdminContent();
  const reorder = useEdit(saveOrder);
  const [adding, setAdding] = useState(false);
  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorLine error={content.error} />;
  const { faqs } = content.data;
  const ids = faqs.map((f) => f.id);
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Questions show in this order on the home page and the FAQ page.
        </p>
        {!adding && (
          <Button onClick={() => setAdding(true)} className="rounded-full">
            <Plus /> Add a question
          </Button>
        )}
      </div>
      {adding && <FaqForm onDone={() => setAdding(false)} />}
      <ErrorLine error={reorder.error} />
      {faqs.map((faq, index) => (
        <FaqForm
          key={`${faq.id}-${faq.question}-${faq.answer}`}
          faq={faq}
          index={index}
          count={faqs.length}
          moving={reorder.isPending}
          onMove={(d) => reorder.mutate({ data: { list: "faqs", ids: moved(ids, index, d) } })}
        />
      ))}
    </div>
  );
}

function FaqForm({
  faq,
  index = 0,
  count = 0,
  moving = false,
  onMove,
  onDone,
}: {
  faq?: AdminContent["faqs"][number];
  index?: number;
  count?: number;
  moving?: boolean;
  onMove?: (direction: -1 | 1) => void;
  onDone?: () => void;
}) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const save = useEdit(saveFaq);
  const remove = useEdit(deleteFaq);
  const dirty = question !== (faq?.question ?? "") || answer !== (faq?.answer ?? "");
  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate(
      { data: { ...(faq ? { id: faq.id } : {}), question, answer } },
      { onSuccess: () => onDone?.() },
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          minLength={3}
          maxLength={300}
          placeholder="Question"
          aria-label="Question"
          className="h-11 grow bg-background font-medium"
        />
        {faq && onMove && (
          <>
            <MoveButtons index={index} count={count} onMove={onMove} disabled={moving} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete question"
              onClick={() =>
                confirm(`Delete “${faq.question}”?`) && remove.mutate({ data: { id: faq.id } })
              }
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        required
        minLength={3}
        maxLength={3000}
        rows={3}
        placeholder="Answer"
        aria-label="Answer"
        className="bg-background"
      />
      <ErrorLine error={save.error ?? remove.error} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!dirty || save.isPending}>
          {save.isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : faq ? (
            "Save"
          ) : (
            "Add question"
          )}
        </Button>
        {onDone && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
