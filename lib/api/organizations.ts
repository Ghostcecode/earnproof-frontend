import { apiClient, bearer, retryRead, retryMutation } from "./client";
import type { Organization } from "./generated/v1";

export type CreateOrganizationRequest = {
  name: string;
  slug: string;
  website?: string;
};

export type UpdateOrganizationRequest = {
  name?: string;
  website?: string;
  status?: Organization["status"];
};

export async function getOrganizations(token: string, signal: AbortSignal): Promise<Organization[]> {
  return retryRead(async (signal) => {
    return apiClient<Organization[]>({
      path: "/organizations",
      method: "GET",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export async function getOrganization(
  token: string,
  organizationId: string,
  signal: AbortSignal
): Promise<Organization> {
  return retryRead(async (signal) => {
    return apiClient<Organization>({
      path: `/organizations/${organizationId}`,
      method: "GET",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export async function createOrganization(
  token: string,
  request: CreateOrganizationRequest,
  signal: AbortSignal
): Promise<Organization> {
  return retryMutation(async (signal) => {
    return apiClient<Organization>({
      path: "/organizations",
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export async function updateOrganization(
  token: string,
  organizationId: string,
  request: UpdateOrganizationRequest,
  signal: AbortSignal
): Promise<Organization> {
  return retryMutation(async (signal) => {
    return apiClient<Organization>({
      path: `/organizations/${organizationId}`,
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export function validateOrganizationName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Organization name is required";
  }
  if (trimmed.length < 2) {
    return "Organization name must be at least 2 characters";
  }
  if (trimmed.length > 100) {
    return "Organization name must be less than 100 characters";
  }
  return null;
}

export function validateOrganizationSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed) {
    return "Organization slug is required";
  }
  if (trimmed.length < 3) {
    return "Slug must be at least 3 characters";
  }
  if (trimmed.length > 50) {
    return "Slug must be less than 50 characters";
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return "Slug can only contain lowercase letters, numbers, and hyphens";
  }
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return "Slug cannot start or end with a hyphen";
  }
  if (trimmed.includes('--')) {
    return "Slug cannot contain consecutive hyphens";
  }
  return null;
}

export function validateWebsiteUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null; // Optional field
  }
  
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return "Website URL must use http or https protocol";
    }
    return null;
  } catch {
    return "Please enter a valid website URL";
  }
}

export function formatOrganizationStatus(status: Organization["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING":
      return "Pending";
    case "SUSPENDED":
      return "Suspended";
    case "REVOKED":
      return "Revoked";
    case "DELETED":
      return "Deleted";
    default:
      return status;
  }
}

export function getStatusTone(status: Organization["status"]): "success" | "warning" | "accent" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    case "SUSPENDED":
    case "REVOKED":
    case "DELETED":
      return "warning";
    default:
      return "accent";
  }
}