// Every piece of page text Shaun can edit from /admin, with the wording the site
// shipped with. The database only stores his changes; deleting one restores the default.
// In headings, a line break starts a new line on the page.

type TextField = { group: string; label: string; value: string; heading?: boolean };

const field = (group: string, label: string, value: string, heading = false): TextField =>
  heading ? { group, label, value, heading } : { group, label, value };

export const textDefaults = {
  // Home page
  "home.hero.title": field("Home page", "Big heading over the photo", "FYSON TILING.", true),
  "home.hero.tagline": field(
    "Home page",
    "Line along the bottom of the photo",
    "Your local Mornington Peninsula tiler",
  ),
  "home.strip.middle": field(
    "Home page",
    "Strip under the photo — middle",
    "Bathrooms · Kitchens · Walls & floors",
  ),
  "home.strip.right": field(
    "Home page",
    "Strip under the photo — right",
    "A personal, local approach",
  ),

  // Sections shared by several pages
  "services.eyebrow": field(
    "Services section (Home & Services)",
    "Small heading",
    "Made for the way you live",
  ),
  "services.title": field(
    "Services section (Home & Services)",
    "Heading",
    "SMALL DETAILS.\nBEAUTIFUL DIFFERENCE.",
    true,
  ),
  "services.intro": field(
    "Services section (Home & Services)",
    "Intro",
    "From a kitchen refresh to a whole new bathroom, let’s make your space feel like you.",
  ),
  "services.1.text": field(
    "Services section (Home & Services)",
    "Bathroom tiling — description",
    "A fresh start for your everyday rituals. Thoughtful wall and floor tiling for bathrooms and ensuites.",
  ),
  "services.2.text": field(
    "Services section (Home & Services)",
    "Kitchens & splashbacks — description",
    "A beautiful backdrop to the heart of your home. From subtle textures to a statement splashback.",
  ),
  "services.3.text": field(
    "Services section (Home & Services)",
    "Wall & floor tiling — description",
    "Bring a space together with considered layouts, clean lines and a finish that feels right at home.",
  ),

  "gallery.eyebrow": field(
    "Inspiration section (Home & Gallery)",
    "Small heading",
    "A few possibilities",
  ),
  "gallery.title": field(
    "Inspiration section (Home & Gallery)",
    "Heading",
    "FIND YOUR INSPIRATION.",
    true,
  ),
  "gallery.intro": field(
    "Inspiration section (Home & Gallery)",
    "Intro",
    "Like something here? Let’s talk about bringing a similar feel to your place.",
  ),

  "projects.eyebrow": field("Projects section (Home)", "Small heading", "Homes we’ve helped shape"),
  "projects.title": field("Projects section (Home)", "Heading", "OUR PROJECTS.", true),
  "projects.intro": field(
    "Projects section (Home)",
    "Intro",
    "A closer look at our work, through the homes we’ve helped shape.",
  ),

  "about.eyebrow": field(
    "About section (Home & About)",
    "Small heading",
    "A local name. A personal approach.",
  ),
  "about.title": field("About section (Home & About)", "Heading", "ABOUT US.", true),
  "about.p1": field(
    "About section (Home & About)",
    "First paragraph",
    "Fyson Tiling is Shaun Fyson’s trusted local tiling business, proudly servicing the Mornington Peninsula. With 20 years of industry experience and an uncompromising eye for detail, we take a thoughtful, considered approach to every aspect of your project.",
  ),
  "about.p2": field(
    "About section (Home & About)",
    "Second paragraph",
    "From selecting the perfect grout colours and tile trim finishes to mapping out tile layouts, we believe every choice matters. Whether you are planning a home renovation or building a brand-new property, let’s start with your vision—we will talk through your space and bring your ideas to life.",
  ),

  "community.eyebrow": field(
    "Social links band (Home & About)",
    "Small heading",
    "From the community",
  ),
  "community.title": field(
    "Social links band (Home & About)",
    "Heading",
    "GET TO KNOW FYSON TILING.",
    true,
  ),
  "community.text": field(
    "Social links band (Home & About)",
    "Text",
    "Connect with Shaun, explore Fyson Tiling on social media, or share your experience on Google.",
  ),

  "map.eyebrow": field("Suburb map (Home & Areas)", "Small heading", "Where we work"),
  "map.title": field(
    "Suburb map (Home & Areas)",
    "Heading",
    "MORNINGTON PENINSULA\nAND SURROUNDS.",
    true,
  ),
  "map.intro": field(
    "Suburb map (Home & Areas)",
    "Intro",
    "Local tiling across the Mornington Peninsula and surrounds — from Mornington and Mount Martha to Sorrento and Portsea, and everywhere in between. Enquire with your suburb to confirm availability for your project.",
  ),

  "faq.eyebrow": field("FAQ section (Home & FAQ)", "Small heading", "Before we begin"),
  "faq.title": field(
    "FAQ section (Home & FAQ)",
    "Heading",
    "GOOD QUESTIONS.\nCLEAR ANSWERS.",
    true,
  ),

  "press.eyebrow": field("Press section (Home & Media)", "Small heading", "In the press"),
  "press.title": field("Press section (Home & Media)", "Heading", "AS SEEN IN PRINT.", true),

  "cta.eyebrow": field(
    "Green “Let’s talk” band (every page)",
    "Small heading",
    "Something beautiful starts here",
  ),
  "cta.title": field("Green “Let’s talk” band (every page)", "Heading", "LET’S TALK TILES.", true),

  // Individual pages
  "servicesPage.eyebrow": field("Services page", "Small heading", "Fyson Tiling services"),
  "servicesPage.title": field(
    "Services page",
    "Page heading",
    "A FRESH FINISH.\nA HOME THAT FEELS LIKE YOU.",
    true,
  ),

  "aboutPage.eyebrow": field("About page", "Small heading", "Behind the name"),
  "aboutPage.title": field("About page", "Page heading", "HELLO, WE’RE\nFYSON TILING.", true),

  "areasPage.eyebrow": field("Service areas page", "Small heading", "Local to the Peninsula"),
  "areasPage.title": field(
    "Service areas page",
    "Page heading",
    "MORNINGTON PENINSULA\nAND SURROUNDS.",
    true,
  ),
  "localAreas.eyebrow": field("Service areas page", "Section small heading", "Where we work"),
  "localAreas.title": field(
    "Service areas page",
    "Section heading",
    "LOCAL TILING ACROSS\nTHE PENINSULA.",
    true,
  ),
  "localAreas.p1": field(
    "Service areas page",
    "First paragraph",
    "Fyson Tiling is based on the Mornington Peninsula and tiles homes across the peninsula and surrounds — from Mornington, Mount Martha and Safety Beach in the north, through Dromana, McCrae, Arthurs Seat, Rosebud and Capel Sound, down to Rye, Blairgowrie, Sorrento and Portsea at the southern tip.",
  ),
  "localAreas.p2": field(
    "Service areas page",
    "Second paragraph",
    "Inland, we service Red Hill, Main Ridge, Point Leo and Fingal, along with the townships in between. Whether it’s a bathroom renovation, a kitchen splashback, new floor tiling or an outdoor entertaining area, Shaun brings 20 years of tiling experience to homes across the region.",
  ),
  "localAreas.p3": field(
    "Service areas page",
    "Third paragraph",
    "Not sure if your suburb is covered? Search the map above or send an enquiry with your location — we’ll confirm availability for your project.",
  ),
  "areas.eyebrow": field("Service areas page", "Grey band small heading", "Close to home"),
  "areas.title": field(
    "Service areas page",
    "Grey band heading",
    "MORNINGTON PENINSULA\nAND SURROUNDS.",
    true,
  ),
  "areas.text": field(
    "Service areas page",
    "Grey band text",
    "Have a project in mind? Share your suburb and we’ll confirm availability for your location.",
  ),

  "galleryPage.eyebrow": field(
    "Inspiration gallery page",
    "Small heading",
    "Colours, textures & possibilities",
  ),
  "galleryPage.title": field(
    "Inspiration gallery page",
    "Page heading",
    "YOUR NEXT SPACE\nSTARTS WITH AN IDEA.",
    true,
  ),
  "galleryPage.intro": field(
    "Inspiration gallery page",
    "Intro",
    "A look at the kinds of spaces we tile — bathrooms, kitchens, walls and floors. For the latest from Fyson Tiling, visit our Instagram or Facebook page.",
  ),

  "projectsPage.title": field("Projects page", "Page heading", "OUR PROJECTS.", true),
  "projectsPage.intro": field(
    "Projects page",
    "Intro",
    "A closer look at our work, through the homes we’ve helped shape.",
  ),

  "mediaPage.eyebrow": field("Media page", "Small heading", "Press & publications"),
  "mediaPage.title": field("Media page", "Page heading", "IN THE MEDIA.", true),
  "mediaPage.intro": field(
    "Media page",
    "Intro",
    "Stories and features about Fyson Tiling from magazines and publications.",
  ),

  "reviewsPage.title": field("Reviews page", "Page heading", "KIND WORDS.", true),
  "reviewsPage.intro": field(
    "Reviews page",
    "Intro",
    "Genuine reviews from homeowners across the Mornington Peninsula and surrounds. Had Shaun tile your place? Your words would mean a lot — share them below.",
  ),

  "faqPage.eyebrow": field("FAQ page", "Small heading", "A little clarity"),
  "faqPage.title": field("FAQ page", "Page heading", "LET’S GET YOUR\nQUESTIONS SORTED.", true),

  "contact.eyebrow": field("Contact page", "Small heading", "Your next chapter"),
  "contact.title": field("Contact page", "Page heading", "LET’S MAKE\nIT HAPPEN.", true),
  "contact.intro": field(
    "Contact page",
    "Intro",
    "A new bathroom? A splashback with character? Tell Shaun what you have in mind. A great space starts with a conversation.",
  ),
  "contact.callNote": field(
    "Contact page",
    "Note under the call button",
    "Tap to call Shaun directly. Prefer to write it down? Use the form and you’ll hear back.",
  ),
} satisfies Record<string, TextField>;

export type TextKey = keyof typeof textDefaults;

export const isTextKey = (key: string): key is TextKey => Object.hasOwn(textDefaults, key);
