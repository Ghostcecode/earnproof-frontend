"use strict";

// Fails when docs/browser-support.md or docs/dependency-policy.md record a
// "Reviewed against" version for next / react / @stellar/freighter-api that
// no longer matches package.json. Both docs live and die by those version
// numbers (supported feature set, wallet handshake compatibility) so a bump
// to any of them must come with a human re-review of the docs, not a silent
// drift. See docs/dependency-policy.md#keeping-this-current.

const fs = require("node:fs");
const path = require("node:path");

const TRACKED_PACKAGES = ["next", "react", "@stellar/freighter-api"];

const DOCS = [
  "docs/browser-support.md",
  "docs/dependency-policy.md",
];

function repoRoot() {
  return path.resolve(__dirname, "..");
}

function loadPackageVersions() {
  const pkgPath = path.join(repoRoot(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const versions = {};
  for (const name of TRACKED_PACKAGES) {
    if (!(name in all)) {
      throw new Error(
        `check-doc-freshness: expected "${name}" in package.json dependencies/devDependencies but it is missing.`,
      );
    }
    versions[name] = all[name];
  }
  return versions;
}

function parseReviewedAgainst(docText, docPath) {
  const match = docText.match(
    /<!-- doc-freshness:start -->\s*Reviewed against: (.+?)\s*\n/,
  );
  if (!match) {
    throw new Error(
      `check-doc-freshness: ${docPath} is missing a "<!-- doc-freshness:start -->" / "Reviewed against:" block.`,
    );
  }
  const versions = {};
  for (const entry of match[1].split(",")) {
    const [name, version] = entry.trim().split(/\s+/);
    if (!name || !version) continue;
    versions[name] = version;
  }
  return versions;
}

function checkDoc(docRelPath, packageVersions) {
  const fullPath = path.join(repoRoot(), docRelPath);
  const text = fs.readFileSync(fullPath, "utf8");
  const reviewed = parseReviewedAgainst(text, docRelPath);

  const mismatches = [];
  for (const name of TRACKED_PACKAGES) {
    const expected = packageVersions[name];
    const documented = reviewed[name];
    if (documented !== expected) {
      mismatches.push(
        `  ${name}: package.json has "${expected}", ${docRelPath} says "${documented ?? "(missing)"}"`,
      );
    }
  }
  return mismatches;
}

function main() {
  const packageVersions = loadPackageVersions();
  const failures = [];

  for (const doc of DOCS) {
    const mismatches = checkDoc(doc, packageVersions);
    if (mismatches.length > 0) {
      failures.push(`${doc} is stale:\n${mismatches.join("\n")}`);
    }
  }

  if (failures.length > 0) {
    console.error("check-doc-freshness: documentation is out of date.\n");
    console.error(failures.join("\n\n"));
    console.error(
      "\nUpdate the \"Reviewed against\" line and \"Last reviewed\" date in the " +
        "affected file(s) after confirming the browser/dependency guidance still " +
        "holds for the new version(s). See docs/dependency-policy.md.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `check-doc-freshness: docs/browser-support.md and docs/dependency-policy.md match package.json for ${TRACKED_PACKAGES.join(", ")}.`,
  );
}

module.exports = {
  TRACKED_PACKAGES,
  DOCS,
  loadPackageVersions,
  parseReviewedAgainst,
  checkDoc,
};

if (require.main === module) {
  main();
}
