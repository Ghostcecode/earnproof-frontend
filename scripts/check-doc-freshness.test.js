const {
  TRACKED_PACKAGES,
  DOCS,
  loadPackageVersions,
  parseReviewedAgainst,
  checkDoc,
} = require("./check-doc-freshness");

describe("parseReviewedAgainst", () => {
  it("parses a well-formed doc-freshness block", () => {
    const doc = [
      "# Some doc",
      "",
      "<!-- doc-freshness:start -->",
      "Reviewed against: next 16.3.0, react 19.2.4, @stellar/freighter-api ^6.0.1",
      "Last reviewed: 2026-08-28",
      "<!-- doc-freshness:end -->",
      "",
      "More content.",
    ].join("\n");

    expect(parseReviewedAgainst(doc, "fixture.md")).toEqual({
      next: "16.3.0",
      react: "19.2.4",
      "@stellar/freighter-api": "^6.0.1",
    });
  });

  it("throws a descriptive error when the block is missing", () => {
    expect(() => parseReviewedAgainst("# No block here", "fixture.md")).toThrow(
      /missing a.*doc-freshness:start/,
    );
  });
});

describe("checkDoc", () => {
  it("reports no mismatches when package.json and the doc agree", () => {
    const packageVersions = {
      next: "16.3.0",
      react: "19.2.4",
      "@stellar/freighter-api": "^6.0.1",
    };

    // Uses a real file under docs/ via a relative path handled by checkDoc's
    // own path resolution, so this doubles as a check that the checked-in
    // doc is well-formed.
    for (const doc of DOCS) {
      expect(checkDoc(doc, packageVersions)).toEqual([]);
    }
  });

  it("reports a mismatch when a tracked package version differs", () => {
    const staleVersions = {
      next: "15.0.0",
      react: "19.2.4",
      "@stellar/freighter-api": "^6.0.1",
    };

    const mismatches = checkDoc(DOCS[0], staleVersions);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatch(/next: package\.json has "15\.0\.0"/);
  });
});

describe("loadPackageVersions and the real repository docs", () => {
  it("keeps docs/browser-support.md and docs/dependency-policy.md in sync with package.json", () => {
    const packageVersions = loadPackageVersions();
    expect(Object.keys(packageVersions).sort()).toEqual([...TRACKED_PACKAGES].sort());

    for (const doc of DOCS) {
      expect(checkDoc(doc, packageVersions)).toEqual([]);
    }
  });
});
