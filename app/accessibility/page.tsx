import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";

export default function AccessibilityPage() {
  return (
    <PublicShell>
      <div className={pageContainer}>
        <PageHeading
          title="Accessibility statement"
          description="Our commitment to making EarnProof accessible to all users."
        />

        <div className="max-w-4xl space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Our commitment</h2>
            <p className="text-sm leading-6 text-slate-300 mb-4">
              EarnProof is committed to ensuring digital accessibility for users with disabilities. 
              We are continually improving the user experience for everyone and applying relevant 
              accessibility standards to ensure we provide equal access to all users.
            </p>
            <p className="text-sm leading-6 text-slate-300">
              We strive to make our platform usable by people with a wide range of abilities and 
              disabilities, including those who rely on keyboard navigation, screen readers, or 
              other assistive technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Accessibility features</h2>
            <p className="text-sm leading-6 text-slate-300 mb-4">
              EarnProof includes the following accessibility features:
            </p>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Keyboard navigation support for all interactive elements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Visible focus indicators on all focusable elements</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Semantic HTML structure with proper headings and landmarks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Alternative text for images and icons</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Form labels and instructions for screen reader users</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Color contrast ratios that meet accessibility guidelines</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Status information that doesn&apos;t rely on color alone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Skip navigation links for efficient page navigation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Responsive design that works at 200% zoom level</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Known limitations</h2>
            <p className="text-sm leading-6 text-slate-300 mb-4">
              While we strive for full accessibility, we acknowledge some current limitations:
            </p>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-amber-300 mt-1">•</span>
                <span>Some complex data visualizations may not be fully accessible to screen readers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-300 mt-1">•</span>
                <span>Wallet integration flows may have varying accessibility depending on the connected wallet software</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-300 mt-1">•</span>
                <span>Some third-party components may not meet all accessibility requirements</span>
              </li>
            </ul>
            <p className="text-sm leading-6 text-slate-300 mt-4">
              We are actively working to address these limitations and improve accessibility across all features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Standards and guidelines</h2>
            <p className="text-sm leading-6 text-slate-300 mb-4">
              Our accessibility efforts are guided by established standards and best practices:
            </p>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Web Content Accessibility Guidelines (WCAG) 2.1</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Section 508 compliance principles</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>WAI-ARIA (Web Accessibility Initiative - Accessible Rich Internet Applications) specifications</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Feedback and support</h2>
            <p className="text-sm leading-6 text-slate-300 mb-4">
              We welcome feedback about the accessibility of EarnProof. If you encounter accessibility 
              barriers or have suggestions for improvement, please let us know.
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-lg font-semibold text-white mb-3">Contact us</h3>
              <p className="text-sm leading-6 text-slate-300 mb-4">
                To report accessibility issues or request assistance, please contact our team:
              </p>
              <a 
                href="mailto:accessibility@earnproof.com?subject=Accessibility%20Feedback"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
              >
                Send accessibility feedback
              </a>
              <p className="text-xs text-slate-400 mt-3">
                We aim to respond to accessibility feedback within 5 business days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Assessment and testing</h2>
            <p className="text-sm leading-6 text-slate-300 mb-4">
              EarnProof has been assessed using a combination of automated testing tools and manual 
              evaluation methods. Our testing includes:
            </p>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Automated accessibility scanning with industry-standard tools</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Keyboard-only navigation testing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Screen reader compatibility testing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Color contrast validation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-300 mt-1">•</span>
                <span>Responsive design testing at various zoom levels</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Continuous improvement</h2>
            <p className="text-sm leading-6 text-slate-300">
              Accessibility is an ongoing effort. We regularly review and update our platform to 
              ensure continued compliance with accessibility standards and to incorporate new best 
              practices as they emerge. This accessibility statement is reviewed and updated as 
              needed to reflect the current state of our accessibility features.
            </p>
          </section>

          <footer className="text-xs text-slate-400 pt-6 border-t border-white/10">
            <p>This accessibility statement was last updated on August 27, 2026.</p>
          </footer>
        </div>
      </div>
    </PublicShell>
  );
}