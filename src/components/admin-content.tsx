import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Plus,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import {
  deleteCategory,
  deleteFaq,
  deletePhoto,
  deleteProject,
  getAdminContent,
  resetImage,
  resetText,
  saveCategory,
  saveFaq,
  saveOrder,
  saveProject,
  saveImage,
  saveText,
  setProjectCover,
  updatePhoto,
  uploadPhoto,
} from "@/lib/content.functions";
import { textDefaults, type TextKey } from "@/lib/site-text";
import { imageDefaults, type ImageKey } from "@/lib/site-images";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cleanDoc, parseRich, richToPlain } from "@/lib/rich-text";
import { RichEditor } from "@/components/rich-editor";
import { SortableList, type DragHandle } from "@/components/sortable-list";
import { placeInSlots, withOrder, type OrderList } from "@/lib/admin-order";
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

const reorderKey = ["admin", "reorder"] as const;

// Drag-and-drop saves: the list updates immediately, saves run one at a time in order,
// and fresh data is only fetched once the last queued save has finished.
function useReorder(list: OrderList) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationKey: reorderKey,
    scope: { id: "reorder" },
    mutationFn: (ids: string[]) => saveOrder({ data: { list, ids } }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: contentKey });
      const previous = queryClient.getQueryData<AdminContent>(contentKey);
      if (previous) queryClient.setQueryData(contentKey, withOrder(previous, list, ids));
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(contentKey, context.previous);
    },
    onSettled: async () => {
      if (queryClient.isMutating({ mutationKey: reorderKey }) > 1) return;
      await queryClient.invalidateQueries({ queryKey: contentKey });
      await router.invalidate();
    },
  });
}

function useAdminContent() {
  return useQuery({ queryKey: contentKey, queryFn: () => getAdminContent() });
}

// Gallery category names in Shaun's order (shared with the lists above via the query cache).
function useCategoryNames() {
  return useAdminContent().data?.categories.map((c) => c.name) ?? [];
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
  const categories = useCategoryNames();
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
              {categories.map((c) => (
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
  handle,
  mode,
  isCover,
  onSetCover,
  projectTitle,
}: {
  photo: AdminPhoto;
  handle: DragHandle;
  mode: "project" | "gallery";
  isCover?: boolean;
  onSetCover?: () => void;
  projectTitle?: string | undefined;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const categories = useCategoryNames();
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
      category: chosen === notInGallery ? null : chosen,
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
          {handle}
          {mode === "project" && isCover && <Badge>Cover photo</Badge>}
          {mode === "project" && magazinePage && <Badge variant="outline">Magazine page</Badge>}
          {mode === "gallery" && photo.category_cover && <Badge>Category cover</Badge>}
          {mode === "gallery" && (
            <span className="text-xs text-muted-foreground">
              {projectTitle ? `From ${projectTitle}` : "Gallery only"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
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
                {categories.map((c) => (
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
  const reorder = useReorder("projects");
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
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Drag ⠿ to reorder. Projects show in this order on the site. The first three appear on the
          home page.
        </p>
        <Button onClick={() => setEditing("new")} className="rounded-full">
          <Plus /> Add a project
        </Button>
      </div>
      <ErrorLine error={reorder.error} />
      {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      <SortableList
        items={projects}
        label={(project) => project.title}
        onReorder={(ids) => reorder.mutate(ids)}
      >
        {(project, handle) => {
          const projectPhotos = photos.filter((p) => p.project_id === project.id);
          const cover =
            projectPhotos.find((p) => p.id === project.cover_photo_id) ??
            projectPhotos.find((p) => !p.magazine_page) ??
            projectPhotos[0];
          return (
            <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
              {handle}
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
              <Button variant="outline" onClick={() => setEditing(project.id)}>
                Edit
              </Button>
            </article>
          );
        }}
      </SortableList>
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
  const reorder = useReorder("project-photos");
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
          <SortableList
            items={ordered}
            label={(photo) => photo.caption || "photo"}
            onReorder={(ids) => reorder.mutate(ids)}
          >
            {(photo, handle) => (
              <PhotoCard
                key={`${photo.id}-${photo.caption}-${photo.category}-${photo.magazine_page}`}
                photo={photo}
                handle={handle}
                mode="project"
                isCover={photo.id === coverId}
                onSetCover={() =>
                  cover.mutate({ data: { projectId: project.id, photoId: photo.id } })
                }
              />
            )}
          </SortableList>
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
  const [filter, setFilter] = useState("All");
  const reorder = useReorder("gallery");
  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorLine error={content.error} />;
  const { photos, projects } = content.data;
  const titles = new Map(projects.map((p) => [p.id, p.title]));
  const gallery = photos
    .filter((p) => p.category && !p.magazine_page)
    .sort((a, b) => a.gallery_order - b.gallery_order || a.id.localeCompare(b.id));
  const shown = gallery.filter((p) => filter === "All" || p.category === filter);

  // Dragging within one category reorders those photos among the slots they already hold
  // in the full gallery, so the other categories keep their places.
  function reorderShown(shownIds: string[]) {
    reorder.mutate(
      placeInSlots(
        gallery.map((p) => p.id),
        shownIds,
      ),
    );
  }

  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        Drag ⠿ to reorder. The inspiration gallery shows these photos in this order. Project photos
        appear here when they have a gallery category. Each category's cover photo is the one shown
        on the home page.
      </p>
      <CategoriesAdmin categories={content.data.categories} photos={photos} />
      <PhotoUploader projectId={null} requireCategory />
      <div className="flex flex-wrap gap-2">
        {["All", ...content.data.categories.map((c) => c.name)].map((c) => (
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
      <SortableList
        items={shown}
        label={(photo) => photo.caption || "photo"}
        onReorder={reorderShown}
      >
        {(photo, handle) => (
          <PhotoCard
            key={`${photo.id}-${photo.caption}-${photo.category}-${photo.focus}`}
            photo={photo}
            handle={handle}
            mode="gallery"
            projectTitle={photo.project_id ? titles.get(photo.project_id) : undefined}
          />
        )}
      </SortableList>
    </div>
  );
}

// ---------------------------------------------------------------- gallery categories

function CategoriesAdmin({
  categories,
  photos,
}: {
  categories: AdminContent["categories"];
  photos: AdminPhoto[];
}) {
  const reorder = useReorder("categories");
  const add = useEdit(saveCategory);
  const [name, setName] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    add.mutate({ data: { name } }, { onSuccess: () => setName("") });
  }
  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-card/40 p-5">
      <div>
        <h2 className="font-display text-2xl">CATEGORIES.</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag ⠿ to reorder. The gallery's filter buttons, in this order. The first three appear on
          the home page. A category only shows on the site once it has photos.
        </p>
      </div>
      <ErrorLine error={reorder.error} />
      <SortableList
        items={categories}
        label={(category) => category.name}
        onReorder={(ids) => reorder.mutate(ids)}
        className="gap-2"
      >
        {(category, handle) => (
          <CategoryRow
            key={`${category.id}-${category.name}`}
            category={category}
            photoCount={photos.filter((p) => p.category === category.name).length}
            handle={handle}
          />
        )}
      </SortableList>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="New category, e.g. Laundries"
          aria-label="New category name"
          className="h-10 max-w-xs bg-background"
        />
        <Button type="submit" size="sm" className="h-10" disabled={!name.trim() || add.isPending}>
          {add.isPending ? <LoaderCircle className="animate-spin" /> : <Plus />} Add category
        </Button>
      </form>
      <ErrorLine error={add.error} />
    </section>
  );
}

function CategoryRow({
  category,
  photoCount,
  handle,
}: {
  category: AdminContent["categories"][number];
  photoCount: number;
  handle: DragHandle;
}) {
  const [name, setName] = useState(category.name);
  const rename = useEdit(saveCategory);
  const remove = useEdit(deleteCategory);
  return (
    <div className="grid gap-1 rounded-xl bg-background/60 p-1">
      <div className="flex flex-wrap items-center gap-2">
        {handle}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          aria-label={`Rename ${category.name}`}
          className="h-10 max-w-xs bg-background"
        />
        {name.trim() !== category.name && (
          <Button
            size="sm"
            className="h-10"
            disabled={!name.trim() || rename.isPending}
            onClick={() => rename.mutate({ data: { id: category.id, name } })}
          >
            {rename.isPending ? <LoaderCircle className="animate-spin" /> : "Rename"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {photoCount} photo{photoCount === 1 ? "" : "s"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${category.name}`}
            title={photoCount ? "Move or remove its photos first" : "Delete category"}
            disabled={photoCount > 0 || remove.isPending}
            onClick={() =>
              confirm(`Delete the “${category.name}” category?`) &&
              remove.mutate({ data: { id: category.id } })
            }
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <ErrorLine error={rename.error ?? remove.error} />
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
    // Saved rich text is JSON; search its words, not the markup.
    const savedText = richToPlain(parseRich(saved.get(key) ?? ""));
    return [field.group, field.label, richToPlain(parseRich(field.value)), savedText].some((s) =>
      s.toLowerCase().includes(query),
    );
  });
  const imageKeys = (Object.keys(imageDefaults) as ImageKey[]).filter((key) => {
    if (!query) return true;
    const slot = imageDefaults[key];
    return [slot.group, slot.label, "photo", "image"].some((s) => s.toLowerCase().includes(query));
  });
  const savedImages = new Map(content.data.images.map((image) => [image.key, image]));
  const groups = [
    ...new Set([
      ...keys.map((key) => textDefaults[key].group),
      ...imageKeys.map((key) => imageDefaults[key].group),
    ]),
  ];
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">
          Edit the wording on each page with the toolbar: bold, italic and links everywhere, plus
          lists in paragraphs. In paragraphs, Enter starts a new paragraph (Shift+Enter for a line
          break); in headings and short lines, Enter starts a new line. “Back to original” restores
          the wording the site launched with.
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
          {imageKeys
            .filter((key) => imageDefaults[key].group === group)
            .map((key) => (
              <ImageField
                key={key}
                imageKey={key}
                saved={savedImages.get(key)}
                photos={content.data.photos}
                projects={content.data.projects}
              />
            ))}
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

// ---------------------------------------------------------------- page photos

const slotFocusOptions: Array<[string, string]> = [
  ["default", "Crop: as originally set"],
  ["center", "Crop: keep the middle"],
  ["center top", "Crop: keep the top"],
  ["center bottom", "Crop: keep the bottom"],
];

function ImageField({
  imageKey,
  saved,
  photos,
  projects,
}: {
  imageKey: ImageKey;
  saved: AdminContent["images"][number] | undefined;
  photos: AdminPhoto[];
  projects: AdminProject[];
}) {
  const slot = imageDefaults[imageKey];
  const chosen = saved?.photo_id ? photos.find((p) => p.id === saved.photo_id) : undefined;
  const focus = saved?.focus ?? null;
  const input = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const save = useEdit(saveImage);
  const reset = useEdit(resetImage);
  const upload = useEdit(async (file: File) => {
    const form = new FormData();
    form.set("file", await shrinkPhoto(file));
    form.set("forPage", "1");
    form.set("projectId", "");
    form.set("category", "");
    form.set("caption", "");
    const { id: photoId } = await uploadPhoto({ data: form });
    await saveImage({ data: { key: imageKey, photoId, focus } });
  });
  const busy = save.isPending || reset.isPending || upload.isPending;
  const choose = (photoId: string | null, newFocus: string | null = focus) =>
    save.mutate({
      data: {
        key: imageKey,
        photoId,
        focus: newFocus as "center" | "center top" | "center bottom" | null,
      },
    });
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[220px_1fr]">
      <img
        src={chosen?.url ?? slot.image}
        alt=""
        style={{ objectPosition: focus ?? slot.focus }}
        className="aspect-[4/3] w-full rounded-md bg-secondary object-cover"
      />
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Label>{slot.label}</Label>
          {saved !== undefined && <Badge variant="outline">Edited</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setPicking(true)}>
            Choose from photos
          </Button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload.mutate(file);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {upload.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />} Upload
            new photo
          </Button>
          {saved !== undefined && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                confirm("Put the original photo back?") && reset.mutate({ data: { key: imageKey } })
              }
            >
              <RotateCcw /> Back to original
            </Button>
          )}
        </div>
        <Select
          value={focus ?? "default"}
          onValueChange={(v) => choose(chosen?.id ?? null, v === "default" ? null : v)}
        >
          <SelectTrigger className="w-60 bg-background" aria-label="Crop">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {slotFocusOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ErrorLine error={save.error ?? reset.error ?? upload.error} />
      </div>
      <PhotoPicker
        open={picking}
        onOpenChange={setPicking}
        title={slot.label}
        photos={photos}
        projects={projects}
        onPick={(photoId) => {
          setPicking(false);
          choose(photoId);
        }}
      />
    </div>
  );
}

// Every photo on the site (project and gallery photos, and earlier page uploads),
// except printed magazine pages.
function PhotoPicker({
  open,
  onOpenChange,
  title,
  photos,
  projects,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  photos: AdminPhoto[];
  projects: AdminProject[];
  onPick: (photoId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const titles = new Map(projects.map((p) => [p.id, p.title]));
  const source = (photo: AdminPhoto) =>
    (photo.project_id && titles.get(photo.project_id)) || photo.category || "Page photo";
  const query = search.trim().toLowerCase();
  const choices = photos
    .filter((photo) => !photo.magazine_page)
    .filter((photo) => !query || `${photo.caption} ${source(photo)}`.toLowerCase().includes(query));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>Choose a photo: {title}</DialogTitle>
        <DialogDescription>Pick any photo from your projects or gallery.</DialogDescription>
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by caption, project or category"
          className="h-10 bg-background"
        />
        <div className="grid max-h-[60svh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {choices.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onPick(photo.id)}
              className="group text-left focus-visible:outline-2 focus-visible:outline-ring"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-md bg-secondary object-cover transition-opacity group-hover:opacity-80"
              />
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {source(photo)}
              </span>
            </button>
          ))}
          {choices.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">No photos match.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextField({ textKey, saved }: { textKey: TextKey; saved: string | undefined }) {
  const field = textDefaults[textKey];
  const current = saved ?? field.value;
  const save = useEdit(saveText);
  const reset = useEdit(resetText);
  // Every field is edited with the same editor and saved as its JSON document.
  const currentValue = JSON.stringify(cleanDoc(parseRich(current)));
  const [value, setValue] = useState(currentValue);
  const [editorKey, setEditorKey] = useState(0);
  const empty = richToPlain(parseRich(value)).trim() === "";
  const undo = () => {
    setValue(currentValue);
    setEditorKey((k) => k + 1);
  };
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={textKey}>{field.label}</Label>
        {saved !== undefined && <Badge variant="outline">Edited</Badge>}
      </div>
      <RichEditor
        key={editorKey}
        id={textKey}
        initial={parseRich(current)}
        variant={
          field.kind === "rich" ? "paragraphs" : field.kind === "heading" ? "heading" : "line"
        }
        onChange={(doc) => setValue(doc ? JSON.stringify(doc) : "")}
      />
      <ErrorLine error={save.error ?? reset.error} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={empty || value === currentValue || save.isPending}
          onClick={() => save.mutate({ data: { key: textKey, value } })}
        >
          {save.isPending ? <LoaderCircle className="animate-spin" /> : "Save"}
        </Button>
        {value !== currentValue && (
          <Button size="sm" variant="ghost" onClick={undo}>
            Undo changes
          </Button>
        )}
        {saved !== undefined && (
          <Button
            size="sm"
            variant="ghost"
            disabled={reset.isPending}
            onClick={() =>
              confirm(
                `Put this back to the original wording?\n\n“${richToPlain(parseRich(field.value))}”`,
              ) && reset.mutate({ data: { key: textKey } })
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
  const reorder = useReorder("faqs");
  const [adding, setAdding] = useState(false);
  if (content.isPending) return <Loading />;
  if (content.isError) return <ErrorLine error={content.error} />;
  const { faqs } = content.data;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Drag ⠿ to reorder. Questions show in this order on the home page and the FAQ page.
        </p>
        {!adding && (
          <Button onClick={() => setAdding(true)} className="rounded-full">
            <Plus /> Add a question
          </Button>
        )}
      </div>
      {adding && <FaqForm onDone={() => setAdding(false)} />}
      <ErrorLine error={reorder.error} />
      <SortableList
        items={faqs}
        label={(faq) => faq.question}
        onReorder={(ids) => reorder.mutate(ids)}
      >
        {(faq, handle) => (
          <FaqForm key={`${faq.id}-${faq.question}-${faq.answer}`} faq={faq} handle={handle} />
        )}
      </SortableList>
    </div>
  );
}

function FaqForm({
  faq,
  handle,
  onDone,
}: {
  faq?: AdminContent["faqs"][number];
  handle?: DragHandle;
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
        {handle}
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
        {faq && (
          <>
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
