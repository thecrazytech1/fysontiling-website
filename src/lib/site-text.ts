import { contact } from "@/lib/site-data";

// Every piece of page text Shaun can edit from /admin, with the wording the site
// shipped with. The database only stores his changes; deleting one restores the default.
//   heading — plain text; a line break starts a new line on the page
//   plain   — one line of plain text (small headings, taglines)
//   rich    — formatted text from the editor: paragraphs, bold, italic, links, lists

type Kind = "heading" | "plain" | "rich";
type TextField<K extends Kind = Kind> = { group: string; label: string; value: string; kind: K };

const heading = (group: string, label: string, value: string): TextField<"heading"> => ({
  group,
  label,
  value,
  kind: "heading",
});
const plain = (group: string, label: string, value: string): TextField<"plain"> => ({
  group,
  label,
  value,
  kind: "plain",
});
const rich = (group: string, label: string, value: string): TextField<"rich"> => ({
  group,
  label,
  value,
  kind: "rich",
});

export const textDefaults = {
  // Home page
  "home.hero.title": heading("Home page", "Big heading over the photo", "FYSON TILING."),
  "home.hero.tagline": plain(
    "Home page",
    "Line along the bottom of the photo",
    "Your local Mornington Peninsula tiler",
  ),
  "home.strip.middle": plain(
    "Home page",
    "Strip under the photo — middle",
    "Bathrooms · Kitchens · Walls & floors",
  ),
  "home.strip.right": plain(
    "Home page",
    "Strip under the photo — right",
    "A personal, local approach",
  ),

  // Sections shared by several pages
  "services.eyebrow": plain(
    "Services section (Home & Services)",
    "Small heading",
    "Made for the way you live",
  ),
  "services.title": heading(
    "Services section (Home & Services)",
    "Heading",
    "SMALL DETAILS.\nBEAUTIFUL DIFFERENCE.",
  ),
  "services.intro": rich(
    "Services section (Home & Services)",
    "Intro",
    "From a kitchen refresh to a whole new bathroom, let’s make your space feel like you.",
  ),
  "services.1.title": plain(
    "Services section (Home & Services)",
    "Bathroom tiling — name",
    "Bathroom tiling",
  ),
  "services.2.title": plain(
    "Services section (Home & Services)",
    "Kitchens & splashbacks — name",
    "Kitchens & splashbacks",
  ),
  "services.3.title": plain(
    "Services section (Home & Services)",
    "Wall & floor tiling — name",
    "Wall & floor tiling",
  ),
  "services.1.text": rich(
    "Services section (Home & Services)",
    "Bathroom tiling — description",
    "A fresh start for your everyday rituals. Thoughtful wall and floor tiling for bathrooms and ensuites.",
  ),
  "services.2.text": rich(
    "Services section (Home & Services)",
    "Kitchens & splashbacks — description",
    "A beautiful backdrop to the heart of your home. From subtle textures to a statement splashback.",
  ),
  "services.3.text": rich(
    "Services section (Home & Services)",
    "Wall & floor tiling — description",
    "Bring a space together with considered layouts, clean lines and a finish that feels right at home.",
  ),

  "gallery.eyebrow": plain(
    "Inspiration section (Home & Gallery)",
    "Small heading",
    "A few possibilities",
  ),
  "gallery.title": heading(
    "Inspiration section (Home & Gallery)",
    "Heading",
    "FIND YOUR INSPIRATION.",
  ),
  "gallery.intro": rich(
    "Inspiration section (Home & Gallery)",
    "Intro",
    "Like something here? Let’s talk about bringing a similar feel to your place.",
  ),

  "projects.eyebrow": plain("Projects section (Home)", "Small heading", "Homes we’ve helped shape"),
  "projects.title": heading("Projects section (Home)", "Heading", "OUR PROJECTS."),
  "projects.intro": rich(
    "Projects section (Home)",
    "Intro",
    "A closer look at our work, through the homes we’ve helped shape.",
  ),

  "about.eyebrow": plain(
    "About section (Home & About)",
    "Small heading",
    "A local name. A personal approach.",
  ),
  "about.title": heading("About section (Home & About)", "Heading", "ABOUT US."),
  "about.p1": rich(
    "About section (Home & About)",
    "First paragraph",
    "Fyson Tiling is Shaun Fyson’s trusted local tiling business, proudly servicing the Mornington Peninsula. With 20 years of industry experience and an uncompromising eye for detail, we take a thoughtful, considered approach to every aspect of your project.",
  ),
  "about.p2": rich(
    "About section (Home & About)",
    "Second paragraph",
    "From selecting the perfect grout colours and tile trim finishes to mapping out tile layouts, we believe every choice matters. Whether you are planning a home renovation or building a brand-new property, let’s start with your vision—we will talk through your space and bring your ideas to life.",
  ),

  "community.eyebrow": plain(
    "Social links band (Home & About)",
    "Small heading",
    "From the community",
  ),
  "community.title": heading(
    "Social links band (Home & About)",
    "Heading",
    "GET TO KNOW FYSON TILING.",
  ),
  "community.text": rich(
    "Social links band (Home & About)",
    "Text",
    "Connect with Shaun, explore Fyson Tiling on social media, or share your experience on Google.",
  ),

  "map.eyebrow": plain("Suburb map (Home & Areas)", "Small heading", "Where we work"),
  "map.title": heading(
    "Suburb map (Home & Areas)",
    "Heading",
    "MORNINGTON PENINSULA\nAND SURROUNDS.",
  ),
  "map.intro": rich(
    "Suburb map (Home & Areas)",
    "Intro",
    "Local tiling across the Mornington Peninsula and surrounds — from Mornington and Mount Martha to Sorrento and Portsea, and everywhere in between. Enquire with your suburb to confirm availability for your project.",
  ),

  "faq.eyebrow": plain("FAQ section (Home & FAQ)", "Small heading", "Before we begin"),
  "faq.title": heading("FAQ section (Home & FAQ)", "Heading", "GOOD QUESTIONS.\nCLEAR ANSWERS."),

  "press.eyebrow": plain("Press section (Home & Media)", "Small heading", "In the press"),
  "press.title": heading("Press section (Home & Media)", "Heading", "AS SEEN IN PRINT."),

  "cta.eyebrow": plain(
    "Green “Let’s talk” band (every page)",
    "Small heading",
    "Something beautiful starts here",
  ),
  "cta.title": heading("Green “Let’s talk” band (every page)", "Heading", "LET’S TALK TILES."),

  // Individual pages
  "servicesPage.eyebrow": plain("Services page", "Small heading", "Fyson Tiling services"),
  "servicesPage.title": heading(
    "Services page",
    "Page heading",
    "A FRESH FINISH.\nA HOME THAT FEELS LIKE YOU.",
  ),

  "aboutPage.eyebrow": plain("About page", "Small heading", "Behind the name"),
  "aboutPage.title": heading("About page", "Page heading", "HELLO, WE’RE\nFYSON TILING."),

  "areasPage.eyebrow": plain("Service areas page", "Small heading", "Local to the Peninsula"),
  "areasPage.title": heading(
    "Service areas page",
    "Page heading",
    "MORNINGTON PENINSULA\nAND SURROUNDS.",
  ),
  "localAreas.eyebrow": plain("Service areas page", "Section small heading", "Where we work"),
  "localAreas.title": heading(
    "Service areas page",
    "Section heading",
    "LOCAL TILING ACROSS\nTHE PENINSULA.",
  ),
  "localAreas.p1": rich(
    "Service areas page",
    "First paragraph",
    "Fyson Tiling is based on the Mornington Peninsula and tiles homes across the peninsula and surrounds — from Mornington, Mount Martha and Safety Beach in the north, through Dromana, McCrae, Arthurs Seat, Rosebud and Capel Sound, down to Rye, Blairgowrie, Sorrento and Portsea at the southern tip.",
  ),
  "localAreas.p2": rich(
    "Service areas page",
    "Second paragraph",
    "Inland, we service Red Hill, Main Ridge, Point Leo and Fingal, along with the townships in between. Whether it’s a bathroom renovation, a kitchen splashback, new floor tiling or an outdoor entertaining area, Shaun brings 20 years of tiling experience to homes across the region.",
  ),
  "localAreas.p3": rich(
    "Service areas page",
    "Third paragraph",
    "Not sure if your suburb is covered? Search the map above or send an enquiry with your location — we’ll confirm availability for your project.",
  ),
  "areas.eyebrow": plain("Service areas page", "Grey band small heading", "Close to home"),
  "areas.title": heading(
    "Service areas page",
    "Grey band heading",
    "MORNINGTON PENINSULA\nAND SURROUNDS.",
  ),
  "areas.text": rich(
    "Service areas page",
    "Grey band text",
    "Have a project in mind? Share your suburb and we’ll confirm availability for your location.",
  ),

  "galleryPage.eyebrow": plain(
    "Inspiration gallery page",
    "Small heading",
    "Colours, textures & possibilities",
  ),
  "galleryPage.title": heading(
    "Inspiration gallery page",
    "Page heading",
    "YOUR NEXT SPACE\nSTARTS WITH AN IDEA.",
  ),
  "galleryPage.intro": rich(
    "Inspiration gallery page",
    "Intro",
    "A look at the kinds of spaces we tile — bathrooms, kitchens, walls and floors. For the latest from Fyson Tiling, visit our Instagram or Facebook page.",
  ),

  "projectsPage.eyebrow": plain("Projects page", "Small heading", "Fyson Tiling"),
  "projectsPage.title": heading("Projects page", "Page heading", "OUR PROJECTS."),
  "projectsPage.intro": rich(
    "Projects page",
    "Intro",
    "A closer look at our work, through the homes we’ve helped shape.",
  ),

  "mediaPage.eyebrow": plain("Media page", "Small heading", "Press & publications"),
  "mediaPage.title": heading("Media page", "Page heading", "IN THE MEDIA."),
  "mediaPage.intro": rich(
    "Media page",
    "Intro",
    "Stories and features about Fyson Tiling from magazines and publications.",
  ),

  "reviewsPage.eyebrow": plain("Reviews page", "Small heading", "From the community"),
  "reviewsPage.title": heading("Reviews page", "Page heading", "KIND WORDS."),
  "reviewsPage.intro": rich(
    "Reviews page",
    "Intro",
    "Genuine reviews from homeowners across the Mornington Peninsula and surrounds. Had Shaun tile your place? Your words would mean a lot — share them below.",
  ),
  "reviewsPage.formEyebrow": plain("Reviews page", "Review form — small heading", "Leave a review"),
  "reviewsPage.formTitle": heading("Reviews page", "Review form — heading", "TELL US HOW IT WENT."),
  "reviewsPage.formNote": rich(
    "Reviews page",
    "Review form — note",
    JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Your review goes to Shaun first and appears here once approved. Happy to share it more widely? ",
            },
            {
              type: "text",
              text: "Leave it on Google too",
              marks: [{ type: "link", attrs: { href: contact.googleReview } }],
            },
            { type: "text", text: "." },
          ],
        },
      ],
    }),
  ),
  "reviewsPage.thanksTitle": heading(
    "Reviews page",
    "After sending a review — heading",
    "THANK YOU FOR YOUR KIND WORDS.",
  ),
  "reviewsPage.thanksText": rich(
    "Reviews page",
    "After sending a review — text",
    "Your review has been received. Shaun reads every one, and it will appear on the website once he has approved it.",
  ),

  "faqPage.eyebrow": plain("FAQ page", "Small heading", "A little clarity"),
  "faqPage.title": heading("FAQ page", "Page heading", "LET’S GET YOUR\nQUESTIONS SORTED."),

  "contact.eyebrow": plain("Contact page", "Small heading", "Your next chapter"),
  "contact.title": heading("Contact page", "Page heading", "LET’S MAKE\nIT HAPPEN."),
  "contact.intro": rich(
    "Contact page",
    "Intro",
    "A new bathroom? A splashback with character? Tell Shaun what you have in mind. A great space starts with a conversation.",
  ),
  "contact.callNote": rich(
    "Contact page",
    "Note under the call button",
    "Tap to call Shaun directly. Prefer to write it down? Use the form and you’ll hear back.",
  ),
  "contact.thanksTitle": heading(
    "Contact page",
    "After sending an enquiry — heading",
    "THANK YOU. YOU’RE ON THE LIST.",
  ),
  "contact.thanksText": rich(
    "Contact page",
    "After sending an enquiry — text",
    "Your project enquiry has been received and saved for Shaun to review.",
  ),
} satisfies Record<string, TextField>;

export type TextKey = keyof typeof textDefaults;
type KeysOfKind<K extends Kind> = {
  [P in TextKey]: (typeof textDefaults)[P]["kind"] extends K ? P : never;
}[TextKey];
export type RichKey = KeysOfKind<"rich">;
export type PlainKey = KeysOfKind<"heading" | "plain">;

export const isTextKey = (key: string): key is TextKey => Object.hasOwn(textDefaults, key);
export const isRichKey = (key: string): key is RichKey =>
  isTextKey(key) && textDefaults[key].kind === "rich";
