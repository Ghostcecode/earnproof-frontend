import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { SettingsNavigation } from "@/components/settings/settings-navigation";
import { PublicShell } from "@/components/layout/public-shell";

export default function SettingsPage() {
  return (
    <PublicShell>
      <section className={`${pageContainer} gap-8 sm:gap-10`}>
        <PageHeading
          description="Manage your organization settings, user access, and administrative preferences."
          eyebrow="Administration"
          title="Settings"
        />
        <SettingsNavigation />
      </section>
    </PublicShell>
  );
}