import Link from "next/link";

export const pageContainer = "mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-5 py-5 sm:gap-5 sm:px-12 sm:py-12";

export function MarketingHero({
  title,
  description,
  action,
  href,
}: {
  title: string;
  description: string;
  action: string;
  href: string;
}) {
  return (
    <section className="flex min-h-[250px] flex-col items-start gap-3.5 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:min-h-[300px] sm:gap-[18px] sm:p-7">
      <StatusBadge>Open protocol</StatusBadge>
      <h2 className="text-2xl font-semibold leading-8 sm:text-4xl sm:font-bold sm:leading-10">{title}</h2>
      <p className="max-w-5xl text-lg leading-8 text-slate-300">{description}</p>
      <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-cyan-300/50 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 sm:h-10" href={href}>
        {action}
      </Link>
    </section>
  );
}

export function FeatureGrid({ items }: { items: { title: string; description: string }[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4" key={item.title}>
          <h3 className="text-xl font-semibold leading-7 text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-5 text-slate-300">{item.description}</p>
        </article>
      ))}
    </section>
  );
}

export function MetricGrid({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="grid w-full gap-3 sm:max-w-[1104px] sm:grid-cols-3 sm:gap-4">
      {items.map((item) => (
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-[18px]" key={item.label}>
          <p className="text-2xl font-semibold leading-8">{item.value}</p>
          <p className="mt-[7px] text-sm leading-5 text-slate-300">{item.label}</p>
        </article>
      ))}
    </section>
  );
}

export function StatusBadge({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "success" | "warning" }) {
  const toneClass = tone === "warning" ? "bg-amber-300/10" : tone === "success" ? "bg-emerald-300/10" : "bg-cyan-300/10";
  return <span className={`inline-flex h-7 w-fit items-center rounded-lg border border-cyan-300/50 px-1.5 text-xs font-semibold uppercase leading-4 text-cyan-200 ${toneClass}`}>{children}</span>;
}

type Row = { primary: string; secondary: string; tertiary: string; status: string; tone?: "success" | "warning" };

export function DataPanel({
  headers,
  rows,
  searchPlaceholder,
}: {
  headers: [string, string, string, string];
  rows: Row[];
  searchPlaceholder: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="mb-4 flex flex-col items-start gap-3 sm:h-[66px] sm:flex-row">
        <label className="grid w-full gap-[7px] text-xs font-semibold text-slate-300 sm:max-w-[370px]">
          Search
          <input className="h-[46px] rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-white placeholder:text-slate-400" placeholder={searchPlaceholder} />
        </label>
        <button className="h-10 rounded-lg border border-white/15 px-8 text-sm font-medium sm:mt-[23px]" type="button">Filter</button>
      </div>
      <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr] gap-2 bg-slate-300/10 p-2 text-xs font-semibold text-slate-300 md:grid">
        {headers.map((header) => <span key={header}>{header}</span>)}
      </div>
      <div className="grid gap-3 md:gap-0">
        {rows.map((row) => (
          <article className="grid gap-2 border border-white/10 p-3 text-sm md:min-h-[58px] md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center md:gap-2 md:px-2" key={row.primary}>
            <span className="font-medium text-white md:font-normal">{row.primary}</span>
            <span className="text-slate-300">{row.secondary}</span>
            <span className="text-slate-300">{row.tertiary}</span>
            <StatusBadge tone={row.tone ?? "success"}>{row.status}</StatusBadge>
          </article>
        ))}
      </div>
    </section>
  );
}
