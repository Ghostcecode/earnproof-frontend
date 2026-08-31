import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { OrganizationManagement } from "@/components/organizations/organization-management";
import { PublicShell } from "@/components/layout/public-shell";

export default function OrganizationsPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10`}>
        <PageHeading
          description="Manage organizations, their status, and associated metadata with proper administrative controls."
          eyebrow="Administration"
          title="Organization Management"
        />
        <OrganizationManagement />
      </section>
    </PublicShell>
  );
}