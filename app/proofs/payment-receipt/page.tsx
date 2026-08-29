import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { PaymentReceiptProofFlow } from "@/components/proofs/payment-receipt-proof-flow";
import { PublicShell } from "@/components/layout/public-shell";

export default function PaymentReceiptProofPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10 sm:px-36 sm:py-16`}>
        <PageHeading
          description="Select an eligible payment, choose your privacy preferences for sender and amount disclosure, and create a verifiable payment receipt proof."
          eyebrow="Worker flow"
          title="Create Payment Receipt Proof"
        />
        <PaymentReceiptProofFlow />
      </section>
    </PublicShell>
  );
}