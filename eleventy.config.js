const markdownIt = require("markdown-it");
const md = markdownIt({ html: false, breaks: false, linkify: true });

// Preview builds show DRAFT posts (with a banner, noindex, off the index).
// Set TPO_ENV=production to drop drafts from the build entirely.
const isProd = process.env.TPO_ENV === "production";

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/video": "video" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });

  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("mdi", (s) => (s ? md.renderInline(String(s)) : ""));
  eleventyConfig.addFilter("pad2", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("longDate", (d) =>
    new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
  );

  // Published posts only: drafts never appear on the blog index or sitemap.
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/posts/*.md").filter((p) => !p.data.draft).sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addGlobalData("isProd", isProd);
  // Preview product names: edit src/_data/products.json, run `node scripts/apply-product-names.js`, rebuild.
  eleventyConfig.addGlobalData("products", require("./src/_data/products.json"));

  eleventyConfig.addPreprocessor("drafts", "md", (data) => {
    if (data.draft && isProd) return false;
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
