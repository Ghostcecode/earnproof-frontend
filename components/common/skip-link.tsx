export function SkipLink() {
  return (
    <a
      className="sr-only focus:not-sr-only focus-visible:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:inline-flex focus:h-10 focus:items-center focus:rounded-lg focus:border focus:border-cyan-300/50 focus:bg-cyan-300 focus:px-4 focus:text-sm focus:font-semibold focus:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      href="#main-content"
    >
      Skip to main content
    </a>
  );
}
