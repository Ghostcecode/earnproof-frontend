import Link from "next/link";
import { PageHeading } from "@/components/common/page-heading";
import {
  MetricGrid,
  StatusBadge,
  pageContainer,
} from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";

type IssuerFixture = {
  name: string;
  status: "active";
  wallet: string;
  verifiedAt: string;
  attestations: string[];
};

const issuer: IssuerFixture = {
  name: "Veridatum Labs",
  status: "active",
  wallet: "GBC4...8X2K",
  verifiedAt: "2026-07-12",
  attestations: ["Payment", "Employment"],
};

const evidenceItems = [
  {
    label: "Registry reference",
    value: "Available",
    description: "This page reflects a public registry reference. It is evidence, not an endorsement.",
  },
  {
    label: "Stellar reference",
    value: "Available",
    description: "The displayed wallet is a shortened public reference only; live contract state is not asserted.",
  },
  {
    label: "Private contact",
    value: "Unavailable",
    description: "No private contact details are published on this issuer page.",
  },
];

export default function VeridatumLabsIssuerPage() {
  return (
    <PublicShell>
      <div className={pageContainer}>
        <Link
          className="w-fit rounded-md text-sm text-cyan-200 underline-offset-4 transition hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200"
          href="/issuers"
        >
          ← Back to issuer directory
        </Link>

        <PageHeading
          eyebrow="Issuer details"
          title={issuer.name}
          description="Public information and disclosed attestation capabilities for this issuer."
        />

        <section
          aria-labelledby="issuer-status-heading"
          className="flex flex-col gap-4 rounded-lg border border-emerald-300/30 bg-emerald-300/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-white" id="issuer-status-heading">
              Issuer status
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-300">
              This issuer is currently listed as active in the provided public fixture.
            </p>
          </div>
          <StatusBadge tone="success">Active</StatusBadge>
        </section>

        <MetricGrid
          items={[
            { value: issuer.wallet, label: "Public wallet reference" },
            { value: issuer.verifiedAt, label: "Registry verification date" },
            { value: `${issuer.attestations.length}`, label: "Disclosed attestation types" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section
            aria-labelledby="public-facts-heading"
            className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6"
          >
            <h2 className="text-xl font-semibold text-white" id="public-facts-heading">
              Public facts
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issuer</dt>
                <dd className="mt-1 text-sm text-white">{issuer.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</dt>
                <dd className="mt-1 text-sm text-white">Active</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wallet</dt>
                <dd className="mt-1 font-mono text-sm text-white">{issuer.wallet}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verified</dt>
                <dd className="mt-1 text-sm text-white">{issuer.verifiedAt}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="attestations-heading"
            className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6"
          >
            <h2 className="text-xl font-semibold text-white" id="attestations-heading">
              Attestations
            </h2>
            <p className="mt-2 text-sm leading-5 text-slate-300">
              Disclosed categories this issuer may attest to. Availability is not a guarantee of any individual claim.
            </p>
            <ul className="mt-5 grid gap-2" aria-label="Available attestation types">
              {issuer.attestations.map((attestation) => (
                <li className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-sm text-cyan-100" key={attestation}>
                  {attestation}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section
          aria-labelledby="evidence-heading"
          className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6"
        >
          <h2 className="text-xl font-semibold text-white" id="evidence-heading">
            Evidence and disclosure
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-300">
            Registry and Stellar references help describe the public record. They are evidence, not endorsement, and this page does not claim live contract state.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {evidenceItems.map((item) => (
              <article className="rounded-md border border-white/10 p-4" key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className={`mt-2 text-sm font-semibold ${item.value === "Unavailable" ? "text-slate-400" : "text-white"}`}>
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="disclosure-heading"
          className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-5 sm:p-6"
        >
          <h2 className="text-xl font-semibold text-white" id="disclosure-heading">
            Before you disclose
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-300">
            EarnProof displays only intentionally disclosed proof information. Review the claim and recipient before sharing anything, and do not treat issuer registration as a financial, legal, or employment recommendation.
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
