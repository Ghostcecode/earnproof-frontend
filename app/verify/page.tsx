import { Suspense } from "react";
import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";
import { VerifyErrorBoundary } from "@/components/common/verify-error-boundary";
import { VerifyProofForm } from "@/components/verification/verify-proof-form";

export default function VerifyPage() {
  return (
    <PublicShell>
      <section className={pageContainer}>
        <PageHeading
          description="Enter a proof ID, upload a credential, or scan a QR code."
          title="Verify a proof"
        />
        <VerifyErrorBoundary>
          <Suspense
            fallback={
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
                Loading verification form...
              </div>
            }
          >
            <VerifyProofForm />
          </Suspense>
        </VerifyErrorBoundary>
      </section>
    </PublicShell>
  );
}
