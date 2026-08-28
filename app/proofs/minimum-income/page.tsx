import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { CreateProofFlow } from "@/components/proofs/create-proof-flow";
import { PublicShell } from "@/components/layout/public-shell";

export default function MinimumIncomeProofPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10 sm:px-36 sm:py-16`}>
        <PageHeading
          description="Connect a Stellar testnet wallet, sync incoming payments, select qualifying income, and create a signed minimum-income credential."
          eyebrow="Worker flow"
          title="Create Minimum Income Proof"
        />
        <CreateProofFlow />
      </section>
    </PublicShell>
  );
}