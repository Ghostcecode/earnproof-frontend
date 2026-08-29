import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { RecurringIncomeProofWizard } from "@/components/proofs/recurring-income-proof-wizard";
import { PublicShell } from "@/components/layout/public-shell";

export default function RecurringIncomeProofPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10 sm:px-36 sm:py-16`}>
        <PageHeading
          description="Configure recurring income intervals, select qualifying payments, and create a verifiable proof of regular income patterns with coverage analysis."
          eyebrow="Worker flow"
          title="Create Recurring Income Proof"
        />
        <RecurringIncomeProofWizard />
      </section>
    </PublicShell>
  );
}