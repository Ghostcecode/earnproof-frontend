import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { IssuerManagement } from "@/components/issuers/issuer-management";
import { PublicShell } from "@/components/layout/public-shell";

export default function IssuersPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10`}>
        <PageHeading
          description="Manage issuers, their organizational relationships, and administrative status."
          eyebrow="Administration"
          title="Issuer Management"
        />
        <IssuerManagement />
      </section>
    </PublicShell>
  );
}