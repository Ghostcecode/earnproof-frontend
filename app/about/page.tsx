import Link from "next/link";
import { pageContainer, StatusBadge } from "@/components/common/production-ui";
import { PageHeading } from "@/components/common/page-heading";
import { PublicShell } from "@/components/layout/public-shell";

export default function AboutPage() {
  return (
    <PublicShell>
      <main className={pageContainer}>
        {/* Hero Section */}
        <PageHeading
          title="About EarnProof"
          description="Open infrastructure for portable, privacy-preserving financial evidence."
        />

        {/* Hero Card */}
        <section className="flex min-h-[250px] flex-col items-start gap-3.5 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:min-h-[300px] sm:gap-[18px] sm:p-7">
          <StatusBadge>Open protocol</StatusBadge>
          <h2 className="text-2xl font-semibold leading-8 sm:text-4xl sm:font-bold sm:leading-10">
            About EarnProof
          </h2>
          <p className="max-w-5xl text-lg leading-8 text-slate-300">
            Open infrastructure for portable, privacy-preserving financial evidence.
          </p>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-cyan-300/50 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 sm:h-10"
            href="/how-it-works"
          >
            Explore the protocol
          </Link>
        </section>

        {/* Features Grid - 3 Cards */}
        <section className="grid gap-3 md:grid-cols-3">
          {/* Open Source Card */}
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-xl font-semibold leading-7 text-white">
              Open source
            </h3>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              Inspect the protocol, schemas, and client libraries. Ownership and implementation are transparent and auditable policy.
            </p>
          </article>

          {/* Non-custodial Card */}
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-xl font-semibold leading-7 text-white">
              Non-custodial
            </h3>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              Wallet keys remain with their owners. EarnProof cannot move funds or recover seed phrases.
            </p>
          </article>

          {/* Built on Stellar Card */}
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-xl font-semibold leading-7 text-white">
              Built on Stellar
            </h3>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              Use Stellar references and national Soroban commitments for portable, independently verifiable evidence.
            </p>
          </article>
        </section>
      </main>
    </PublicShell>
  );
}
