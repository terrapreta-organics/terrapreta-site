// JSON-LD for the page. Facts come from the old site's live schema
// (Organization, WebSite, LocalBusiness) and from copy already on this site.
// Prices, star ratings, and the placeholder phone number from an older
// commit of the Vite repo are intentionally not included.

function abs(origin, path) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return origin + (path.startsWith("/") ? path : `/${path}`);
}

function plain(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function postalAddress(seo) {
  const address = seo.address || {};
  return {
    "@type": "PostalAddress",
    streetAddress: address.street,
    addressLocality: address.locality,
    addressRegion: address.region,
    postalCode: address.postal,
    addressCountry: address.country,
  };
}

function breadcrumbs(origin, pageUrl, title) {
  if (!pageUrl || pageUrl === "/" || pageUrl === "/404.html") return null;
  const crumbs = [{ name: "Home", item: `${origin}/` }];
  if (pageUrl.startsWith("/reclamation/restoration")) {
    crumbs.push({ name: "Reclamation", item: `${origin}/reclamation/` });
  } else if (pageUrl.startsWith("/blog/") && pageUrl !== "/blog/") {
    crumbs.push({ name: "Blog", item: `${origin}/blog/` });
  }
  crumbs.push({ name: title || "Page", item: origin + pageUrl });
  return {
    "@type": "BreadcrumbList",
    "@id": `${origin}${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

function productNode(data, origin, canonical) {
  const products = data.products || {};
  const pageUrl = data.page && data.page.url;
  let name;
  let category;
  if (pageUrl === "/agriculture/") {
    name = products.agriculture;
    category = "Organic fertilizer";
  } else if (pageUrl === "/reclamation/") {
    name = products.reclamation;
    category = "Soil amendment";
  }
  if (!name) return null;
  const image = data.hero && data.hero.image;
  return {
    "@type": "Product",
    "@id": `${canonical}#product`,
    name,
    description: data.meta_description,
    category,
    image: image ? abs(origin, image) : undefined,
    brand: { "@type": "Brand", name: data.site.name },
  };
}

function faqNode(data, canonical) {
  const questions = [];
  for (const block of data.blocks || []) {
    if (!block || block.type !== "faq" || !Array.isArray(block.items)) continue;
    for (const item of block.items) {
      if (!item || !item.question || !item.answer) continue;
      questions.push({
        "@type": "Question",
        name: plain(item.question),
        acceptedAnswer: { "@type": "Answer", text: plain(item.answer) },
      });
    }
  }
  if (!questions.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    mainEntity: questions,
  };
}

function articleNode(data, origin, canonical, orgId) {
  const layout = data.layout || "";
  const inputPath = (data.page && data.page.inputPath) || "";
  const isPost = layout === "layouts/post.njk" || inputPath.includes("/blog/posts/");
  if (!isPost || data.draft) return null;
  const published = data.page && data.page.date ? new Date(data.page.date) : null;
  return {
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    headline: data.title,
    description: data.description,
    datePublished: published && !Number.isNaN(published.getTime()) ? published.toISOString().slice(0, 10) : undefined,
    image: data.image ? abs(origin, data.image) : undefined,
    inLanguage: "en-CA",
    author: { "@id": orgId },
    publisher: { "@id": orgId },
    mainEntityOfPage: canonical,
  };
}

function buildJsonLd(data) {
  const site = data.site || {};
  const seo = data.seo || {};
  const origin = String(site.url || "").replace(/\/$/, "");
  if (!origin) return null;
  const pageUrl = (data.page && data.page.url) || "/";
  const canonical = origin + pageUrl;
  const orgId = `${origin}/#organization`;
  const description = seo.description;
  const hours = seo.opening_hours || {};
  const geo = seo.geo || {};

  const graph = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: site.name,
      url: `${origin}/`,
      logo: abs(origin, seo.logo),
      description,
      email: site.email,
      address: postalAddress(seo),
      areaServed: [
        { "@type": "State", name: "Alberta" },
        { "@type": "Country", name: "Canada" },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: site.email,
        availableLanguage: "English",
      },
      sameAs: seo.same_as,
    },
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      name: site.name,
      url: `${origin}/`,
      description,
      inLanguage: "en-CA",
      publisher: { "@id": orgId },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${origin}/#localbusiness`,
      name: site.name,
      description,
      url: `${origin}/`,
      email: site.email,
      image: abs(origin, seo.logo),
      address: postalAddress(seo),
      geo: {
        "@type": "GeoCoordinates",
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
      areaServed: [{ "@type": "State", name: "Alberta" }],
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours.days,
        opens: hours.opens,
        closes: hours.closes,
      },
    },
  ];

  for (const node of [
    breadcrumbs(origin, pageUrl, data.title),
    productNode(data, origin, canonical),
    faqNode(data, canonical),
    articleNode(data, origin, canonical, orgId),
  ]) {
    if (node) graph.push(node);
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

module.exports = {
  jsonLd(data) {
    return buildJsonLd(data);
  },
};
