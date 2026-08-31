import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  allowedOriginsFromEnv,
  toSafeExternalHref,
} from "@/lib/validation/external-url";
import { appConfig } from "@/config/app";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "rel" | "target"> & {
  href: string;
  children: ReactNode;
};

export function allowedExternalOrigins(): string[] {
  return allowedOriginsFromEnv([
    appConfig.helpUrl,
    appConfig.stellarExplorerUrl,
  ]);
}

/**
 * Renders an external anchor only after scheme/origin validation.
 * Untrusted hrefs are not injected into HTML.
 */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  const safe = toSafeExternalHref(href, {
    allowedOrigins: allowedExternalOrigins(),
    requireHttps: !href.startsWith("http://localhost"),
  });

  if (!safe.ok) {
    return (
      <span className="text-slate-400" data-blocked-url="true">
        {children}
      </span>
    );
  }

  return (
    <a {...rest} href={safe.href} rel={safe.rel} target="_blank">
      {children}
    </a>
  );
}
