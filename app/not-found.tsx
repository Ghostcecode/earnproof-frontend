import Link from "next/link";
import { ExternalLink } from "@/components/common/external-link";
import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";
import { appConfig } from "@/config/app";

export default function NotFound() {
  return (
    <PublicShell>
      <section className={pageContainer}>
        <PageHeading
          description="The page you're looking for doesn't exist or may have moved."
          eyebrow="404"
          title="Page not found"
        />
        <Link
          className="inline-flex h-11 w-fit items-center justify-center rounded-lg border border-cyan-300/50 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:h-10"
          href="/"
        >
          Return home
        </Link>
      </section>
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          {/* Circular loading animation icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <svg
                className="h-full w-full animate-spin"
                style={{ animationDuration: "2s" }}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan-400/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="62.83"
                  strokeDashoffset="20"
                  strokeLinecap="round"
                  className="text-cyan-400"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl sm:mb-4">
            Page not found
          </h1>

          {/* Description */}
          <p className="mb-8 text-sm text-slate-300 sm:text-base sm:mb-10">
            The page may have moved, expired, or never existed.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-cyan-400 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 focus:outline-2 focus:outline-offset-2 focus:outline-cyan-400 sm:h-10"
            >
              Go to dashboard
            </Link>
            <ExternalLink
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-400/30 bg-transparent px-6 text-sm font-medium text-slate-300 transition hover:bg-slate-400/10 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-cyan-400 sm:h-10"
              href={appConfig.helpUrl}
            >
              Open help centre
            </ExternalLink>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
