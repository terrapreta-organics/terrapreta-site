#!/usr/bin/env node
/**
 * Flip preview product names from src/_data/products.json across src/ copy.
 * Usage:
 *   node scripts/apply-product-names.js
 * Edit products.json first (reclamation / agriculture), then run this, then rebuild.
 *
 * Replaces every previous known alias with the current products.json values.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(root, "src/_data/products.json"), "utf8"));
const aliases = {
  reclamation: ["TerraRevive", "SuperN-Revive", "%%PRODUCT_RECLAMATION%%", "[[PRODUCT_RECLAMATION]]", "__PRODUCT_RECLAMATION__"],
  agriculture: ["SuperN", "%%PRODUCT_AG%%", "[[PRODUCT_AG]]", "__PRODUCT_AG__"],
};

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "admin" || ent.name === "node_modules" || ent.name === "_site") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(md|njk|html|txt)$/.test(ent.name)) out.push(p);
  }
  return out;
}

// Longest-first so SuperN-Revive is replaced before SuperN on reclamation files.
function applyFile(file) {
  let t = fs.readFileSync(file, "utf8");
  const orig = t;
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const isReclamationSide =
    /src\/pages\/reclamation\.md$/.test(rel) ||
    /src\/pages\/restoration\.md$/.test(rel) ||
    /src\/blog\/posts\/the-aer-two-year-wait\.md$/.test(rel) ||
    // home reclamation card handled via full-file rewrite of both names globally with care
    false;

  // Global strategy: replace reclamation aliases with products.reclamation,
  // then agriculture aliases with products.agriculture.
  // Do SuperN-Revive before SuperN.
  const reclSorted = [...aliases.reclamation].sort((a, b) => b.length - a.length);
  const agSorted = [...aliases.agriculture].sort((a, b) => b.length - a.length);
  for (const a of reclSorted) t = t.split(a).join(products.reclamation);
  for (const a of agSorted) t = t.split(a).join(products.agriculture);

  if (t !== orig) {
    fs.writeFileSync(file, t);
    return true;
  }
  return false;
}

const files = walk(path.join(root, "src"));
let n = 0;
for (const f of files) if (applyFile(f)) n++;
console.log(`apply-product-names: updated ${n} files → reclamation="${products.reclamation}", agriculture="${products.agriculture}"`);
console.log("Note: on reclamation pages, avoid the agriculture name. Grep after running.");
