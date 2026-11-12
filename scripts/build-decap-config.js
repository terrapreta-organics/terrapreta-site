// Generates src/admin/config.yml for Decap CMS. Run: npm run cms-config
const fs = require("fs");
const yaml = require("js-yaml");

const str = (name, label, extra = {}) => ({ name, label, widget: "string", required: false, ...extra });
const txt = (name, label, extra = {}) => ({ name, label, widget: "text", required: false, ...extra });
const mdw = (name, label, extra = {}) => ({ name, label, widget: "markdown", required: false, buttons: ["bold", "italic", "link", "bulleted-list", "numbered-list"], editor_components: [], ...extra });
const img = (name, label) => ({ name, label, widget: "image", required: false, choose_url: false });
const photo = (name, label) => ({ name, label, widget: "object", fields: [img("image", "Photo"), str("alt", "Photo description (for screen readers)"), str("position", "Photo focus, e.g. center 60%")] });
const num = str("number", "Section number, e.g. 01");
const label = str("label", "Section label");
const heading = str("heading", "Heading");

const blockTypes = [
  { name: "text", label: "Text section", widget: "object", fields: [num, label, heading, mdw("body", "Body"), str("note", "Internal note (shows in ochre)")] },
  { name: "photo", label: "Full-width photo", widget: "object", fields: [img("image", "Photo"), str("alt", "Photo description"), str("caption", "Caption (optional)"), { name: "height", label: "Height in px", widget: "number", required: false }, str("position", "Photo focus")] },
  { name: "clip", label: "Text with a short looping video", widget: "object", fields: [str("number", "Section number"), str("label", "Section label"), str("heading", "Heading"), { name: "body", label: "Text", widget: "markdown", required: false }, { name: "video", label: "Video file (mp4)", widget: "file", required: false }, img("poster", "Still image shown before the video plays"), str("alt", "Video description")] },
  { name: "duo", label: "Two photos side by side", widget: "object", fields: [photo("left", "Left photo"), photo("right", "Right photo"), str("caption", "Caption (optional)")] },
  { name: "rows", label: "Spec rows", widget: "object", fields: [num, label, heading, mdw("body", "Intro"),
      { name: "rows", label: "Rows", widget: "list", fields: [str("key", "Label"), str("value", "Value"), str("status", "Tag on the right (optional)"),
        { name: "status_style", label: "Tag colour", widget: "select", options: [{ label: "Green (ok)", value: "ok" }, { label: "Ochre (pending)", value: "soon" }], required: false },
        { name: "hide", label: "Hide this row", widget: "boolean", required: false, default: false }] },
      str("note", "Internal note")] },
  { name: "list", label: "Numbered list", widget: "object", fields: [num, label, heading, mdw("body", "Intro"), { name: "items", label: "Items", widget: "list", field: str("item", "Item") }, { name: "small", label: "Smaller text", widget: "boolean", required: false }, str("note", "Internal note")] },
  { name: "why", label: "Four boxes (Why SuperN)", widget: "object", fields: [num, label, heading, { name: "boxes", label: "Boxes", widget: "list", fields: [str("title", "Title"), mdw("body", "Text"), str("note", "Internal note")] }] },
  { name: "faq", label: "Questions", widget: "object", fields: [num, label, { name: "items", label: "Questions", widget: "list", fields: [str("question", "Question"), mdw("answer", "Answer")] }] },
  { name: "hidden", label: "Hidden placeholder (preview only)", widget: "object", fields: [num, label, str("marker", "Marker"), txt("body", "Internal note")] },
  { name: "paths", label: "Pick-your-side tiles", widget: "object", fields: [{ name: "tiles", label: "Tiles", widget: "list", fields: [num, label, heading, mdw("body", "Text"), str("link_text", "Link text"), str("link_url", "Link URL"), img("image", "Photo"), str("alt", "Photo description"), str("position", "Photo focus")] }] },
  { name: "cta", label: "Quote banner", widget: "object", fields: [
      { name: "style", label: "Colour", widget: "select", options: [{ label: "Soil (dark brown)", value: "soil" }, { label: "Moss (green)", value: "moss" }], required: false },
      str("eyebrow", "Small label"), heading, mdw("body", "Text"),
      { name: "buttons", label: "Buttons", widget: "list", fields: [str("text", "Text"), str("url", "Link"), { name: "fill", label: "Solid button", widget: "boolean", required: false }] }] },
  { name: "form", label: "Quote form", widget: "object", fields: [num, label, heading, mdw("body", "Intro"), str("message_placeholder", "Message box hint"), str("submit_text", "Button text"),
      { name: "types", label: "'I'm asking about' options", widget: "list", fields: [str("value", "Value"), str("text", "Text")] }] },
];

const pageFields = (withHero = true, heroFull = false) => [
  { name: "layout", widget: "hidden", default: "layouts/page.njk" },
  { name: "permalink", label: "URL", widget: "string" },
  str("title", "Page name"),
  str("meta_title", "Search title (shows in Google and the browser tab)"),
  txt("meta_description", "Search description (about 150 characters)"),
  ...(heroFull ? [{ name: "header_over", label: "Menu over photo", widget: "boolean", required: false }] : []),
  ...(withHero ? [{ name: "hero", label: "Top of page", widget: "object", fields: [
      { name: "style", label: "Style", widget: "select", options: [{ label: "Big photo with title on it", value: "full" }, { label: "Title, then photo", value: "top" }] },
      str("eyebrow", "Small label"), str("title", "Big title"), txt("intro", "Intro line"), img("image", "Photo"), str("alt", "Photo description"), str("position", "Photo focus"),
      { name: "video", label: "Background video (mp4, no sound, plays on desktop only)", widget: "file", required: false }, { name: "video_webm", label: "Background video, WebM version (optional)", widget: "file", required: false }, { name: "video_poster", label: "Still shown while the video loads", widget: "image", required: false },
      { name: "buttons", label: "Buttons", widget: "list", required: false, fields: [str("text", "Button text"), str("url", "Link"), { name: "fill", label: "Solid button", widget: "boolean", required: false }] }] }] : []),
  { name: "blocks", label: "Sections", widget: "list", types: blockTypes, typeKey: "type" },
];

const config = {
  backend: { name: "git-gateway", branch: "main" },
  // TODO: Decap needs a Git repo hookup (Netlify site linked to GitHub, Identity and Git Gateway on). See README.
  site_url: "https://terrapreta.ca",
  display_url: "https://terrapreta.ca",
  locale: "en",
  media_folder: "src/images",
  public_folder: "/images",
  publish_mode: "editorial_workflow",
  collections: [
    {
      name: "blog", label: "Blog posts", label_singular: "Blog post", folder: "src/blog/posts", create: true, slug: "{{slug}}",
      summary: "{{title}} ({{date}})", sortable_fields: ["date", "title"],
      fields: [
        { name: "title", label: "Title", widget: "string" },
        txt("description", "Short summary (shows on the blog page and in Google)"),
        { name: "date", label: "Date", widget: "datetime", format: "YYYY-MM-DD", date_format: "YYYY-MM-DD", time_format: false },
        { name: "draft", label: "Draft (keeps it off the blog page and out of Google)", widget: "boolean", default: true },
        { name: "category", label: "Category", widget: "select", options: ["Reclamation", "Agriculture", "From the plant"], required: false },
        img("image", "Top photo"), str("image_alt", "Photo description"), str("image_position", "Photo focus"),
        { name: "body", label: "Post", widget: "markdown" },
      ],
    },
    {
      name: "pages", label: "Pages", editor: { preview: false },
      files: [
        { name: "home", label: "Home", file: "src/pages/home.md", fields: pageFields(true, true) },
        { name: "reclamation", label: "Reclamation", file: "src/pages/reclamation.md", fields: pageFields() },
        { name: "restoration", label: "Reclamation: Restoration", file: "src/pages/restoration.md", fields: pageFields() },
        { name: "agriculture", label: "Agriculture", file: "src/pages/agriculture.md", fields: pageFields() },
        { name: "contact", label: "Contact", file: "src/pages/contact.md", fields: pageFields() },
        { name: "blog_index", label: "Blog page", file: "src/pages/blog.md", fields: [
            { name: "layout", widget: "hidden", default: "layouts/blog-index.njk" }, { name: "permalink", widget: "hidden", default: "/blog/" },
            str("title", "Page name"), str("meta_title", "Search title"), txt("meta_description", "Search description"),
            { name: "hero", label: "Top of page", widget: "object", fields: [str("eyebrow", "Small label"), str("title", "Big title"), txt("intro", "Intro line")] },
            str("empty_text", "Text when there are no posts")] },
      ],
    },
    {
      name: "settings", label: "Site settings", editor: { preview: false },
      files: [
        { name: "site", label: "Menu, footer and tracking", file: "src/_data/site.json", fields: [
          str("name", "Business name"), str("url", "Site address"), str("ga4", "Google Analytics ID"),
          { name: "noindex", label: "Hide from Google (preview mode)", widget: "boolean" },
          str("email", "Email"), str("address", "Address"), str("footer_left", "Footer text"),
          { name: "nav", label: "Menu", widget: "list", fields: [str("text", "Text"), str("url", "Link")] },
          { name: "quote_button", label: "Quote button", widget: "object", fields: [str("text", "Text"), str("url", "Link")] },
        ]},
        { name: "products", label: "Product names (preview flip)", file: "src/_data/products.json", fields: [
          str("reclamation", "Reclamation product name"),
          str("agriculture", "Agriculture product name"),
        ]},
      ],
    },
  ],
};

const header = "# Generated by scripts/build-decap-config.js. Edit that file, then run: npm run cms-config\n";
fs.writeFileSync("src/admin/config.yml", header + yaml.dump(config, { lineWidth: 140, noRefs: true }));
console.log("wrote src/admin/config.yml");
