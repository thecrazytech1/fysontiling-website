import { aboutPhoto, hero, services } from "@/lib/site-data";

// Photos in fixed places on the pages that Shaun can change from Admin → Page text.
// `group` matches the page text groups, so each image sits with its section's words.
// The database stores only his choice; no choice (or a deleted photo) shows `image`.

type ImageSlot = { group: string; label: string; image: string; alt: string; focus: string };

export const imageDefaults = {
  "home.hero": {
    group: "Home page",
    label: "Big photo at the top",
    image: hero,
    alt: "Tiled bathroom by Fyson Tiling",
    focus: "65% center",
  },
  "services.1.image": {
    group: "Services section (Home & Services)",
    label: "Bathroom tiling - photo",
    image: services[0]?.image ?? hero,
    alt: "Bathroom tiling by Fyson Tiling",
    focus: "center",
  },
  "services.2.image": {
    group: "Services section (Home & Services)",
    label: "Kitchens & splashbacks - photo",
    image: services[1]?.image ?? hero,
    alt: "Kitchens & splashbacks by Fyson Tiling",
    focus: "center",
  },
  "services.3.image": {
    group: "Services section (Home & Services)",
    label: "Wall & floor tiling - photo",
    image: services[2]?.image ?? hero,
    alt: "Wall & floor tiling by Fyson Tiling",
    focus: "center",
  },
  "about.photo": {
    group: "About section (Home & About)",
    label: "Photo",
    image: aboutPhoto,
    alt: "The people behind Fyson Tiling",
    focus: "center",
  },
} satisfies Record<string, ImageSlot>;

export type ImageKey = keyof typeof imageDefaults;

export const isImageKey = (key: string): key is ImageKey => Object.hasOwn(imageDefaults, key);
