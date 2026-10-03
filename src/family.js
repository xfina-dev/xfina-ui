// The family, in the order the switcher and the family cards show it. Xfina,
// the flagship, comes first. A new member is a row here and a release, and
// every site learns it on its next upgrade.
//
// Xfingine has no site: it is a library, documented on crates.io, npm and
// PyPI, so its entry opens its repository. `external` keeps it out of SITES,
// so <XfinaHeader site="xfingine"> is an error rather than a header for a
// site that does not exist.

export const FAMILY = Object.freeze(
  [
    {
      id: "xfina",
      label: "Xfina",
      title: "Xfina",
      url: "https://xfina.dev/",
      repo: "xfina-dev/xfina",
      role: "Statement parser",
      about:
        "Reads Indian bank, credit card, mutual fund and brokerage statements into structured data. Rust compiled to WebAssembly, so parsing happens on your machine.",
      tagline:
        "e<strong>X</strong>tract <strong>fina</strong>ncial statements entirely in your browser with Rust/Wasm<br>" +
        "Fast, private, zero-setup, and without uploading your files to any server.",
    },
    {
      id: "labs",
      label: "Labs",
      title: "Xfina Labs",
      url: "https://labs.xfina.dev/",
      repo: "xfina-dev/xfina-labs",
      role: "Finance tools",
      about:
        "Apps built on Xfina and Xfingine, starting with the Portfolio Engine. Everything runs in your browser; nothing is uploaded.",
      tagline:
        "Experimental finance tools for long-term investors.<br>" +
        "Everything runs in your browser; nothing is uploaded to any server.",
    },
    {
      id: "xfingine",
      label: "Xfingine",
      title: "Xfingine",
      url: "https://github.com/xfina-dev/xfingine",
      repo: "xfina-dev/xfingine",
      role: "Financial engine",
      about:
        "Pure computation engines for personal finance planning, such as inflation-adjusted EMI schedules. A Rust core, published to crates.io, npm and PyPI.",
      external: true,
    },
    {
      id: "data",
      label: "Data",
      title: "Xfina Data",
      url: "https://data.xfina.dev/",
      repo: "xfina-dev/xfina-data",
      role: "Open datasets",
      about:
        "Indian FX and inflation series as plain CSV. Every value traces back to a source document kept unchanged in a public archive.",
      tagline:
        "Open Indian financial data as plain CSV, previewed before you use it.<br>" +
        "Every value traces back to a source document kept unchanged in a public archive.",
    },
  ].map((member) => Object.freeze(member)),
);

export const SITES = Object.freeze(FAMILY.filter((member) => !member.external));

// Products built on the family, shown under it. They are not part of it:
// each has its own brand and its own UI, and none uses xfina-ui. `uses`
// names the family members each one is built on, and `status`, if set, is
// shown as a badge.
export const USED_BY = Object.freeze(
  [
    {
      id: "xsteer",
      title: "Xsteer",
      url: "https://xsteer.in/",
      role: "The Personal Finance OS",
      about:
        "Turns your parsed statements into a dated plan for the month: what to move between accounts, what each card and expense needs, and how to invest and plan for tax.",
      uses: ["xfina", "xfingine", "data"],
      status: "In active development",
    },
    {
      id: "building-wealth",
      title: "Building Wealth",
      url: "https://sakthipriyan.com/building-wealth/tools/realvalue-portfolio/",
      // The part of the site built on the family, named so a reader knows
      // where to look.
      role: "RealValue Portfolio",
      about:
        "Mutual fund and IBKR holdings in one place, with XIRR and returns in real rupees: US dollars at SBI's TT rates, and growth net of Indian inflation.",
      uses: ["data"],
    },
  ].map((product) => Object.freeze({ ...product, uses: Object.freeze(product.uses) })),
);

// The author's writing on personal finance, where these tools come from.
// Labelled by what the reader finds there rather than by its domain.
export const AUTHOR = Object.freeze({ label: "Building Wealth", url: "https://sakthipriyan.com/building-wealth" });

// A misspelt site would otherwise draw a header for no site at all. Fail where
// the author will see it.
export function siteFor(id) {
  const site = SITES.find((s) => s.id === id);
  if (!site) throw new Error(`xfina-ui: unknown site "${id}"; expected one of ${SITES.map((s) => s.id).join(", ")}`);
  return site;
}
