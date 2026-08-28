import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { CreateProofFlow } from "@/components/proofs/create-proof-flow";
import { PublicShell } from "@/components/layout/public-shell";
import Link from "next/link";

export default function CreateProofPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10 sm:px-36 sm:py-16`}>
        <PageHeading
          description="Create verifiable income and payment proofs using privacy-preserving credentials on Stellar testnet."
          eyebrow="Worker flow"
          title="Create Proofs"
        />
        
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/proofs/minimum-income"
            className="block rounded-lg border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.06] transition"
          >
            <h2 className="text-xl font-semibold text-white">Minimum Income Proof</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Prove you earned at least a threshold amount over a time period while keeping transaction details private.
            </p>
            <div className="mt-4 text-xs font-semibold text-cyan-300">
              Create Income Proof →
            </div>
          </Link>

          <Link
            href="/proofs/payment-receipt"
            className="block rounded-lg border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.06] transition"
          >
            <h2 className="text-xl font-semibold text-white">Payment Receipt Proof</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Create a verifiable receipt for a specific payment with selective privacy controls for sender and amount.
            </p>
            <div className="mt-4 text-xs font-semibold text-cyan-300">
              Create Receipt Proof →
            </div>
          </Link>

          <Link
            href="/proofs/recurring-income"
            className="block rounded-lg border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.06] transition"
          >
            <h2 className="text-xl font-semibold text-white">Recurring Income Proof</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Prove regular income patterns with configurable intervals and comprehensive coverage analysis.
            </p>
            <div className="mt-4 text-xs font-semibold text-cyan-300">
              Create Recurring Proof →
            </div>
          </Link>
        </div>
        <CreateProofFlow />
      </section>
    </PublicShell>
  );
}
