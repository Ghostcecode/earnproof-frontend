import { apiClient, bearer, retryRead, retryMutation } from "./client";
import type { Issuer } from "./generated/v1";

export type CreateIssuerRequest = {
  name: string;
  organizationId?: string;
};

export type UpdateIssuerRequest = {
  name?: string;
  status?: Issuer["status"];
  organizationId?: string;
};

export async function getIssuers(token: string, signal: AbortSignal): Promise<Issuer[]> {
  return retryRead(async (signal) => {
    return apiClient<Issuer[]>({
      path: "/issuers",
      method: "GET",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export async function getIssuer(
  token: string,
  issuerId: string,
  signal: AbortSignal
): Promise<Issuer> {
  return retryRead(async (signal) => {
    return apiClient<Issuer>({
      path: `/issuers/${issuerId}`,
      method: "GET",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export async function createIssuer(
  token: string,
  request: CreateIssuerRequest,
  signal: AbortSignal
): Promise<Issuer> {
  return retryMutation(async (signal) => {
    return apiClient<Issuer>({
      path: "/issuers",
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export async function updateIssuer(
  token: string,
  issuerId: string,
  request: UpdateIssuerRequest,
  signal: AbortSignal
): Promise<Issuer> {
  return retryMutation(async (signal) => {
    return apiClient<Issuer>({
      path: `/issuers/${issuerId}`,
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export function validateIssuerName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Issuer name is required";
  }
  if (trimmed.length < 2) {
    return "Issuer name must be at least 2 characters";
  }
  if (trimmed.length > 100) {
    return "Issuer name must be less than 100 characters";
  }
  return null;
}

export function formatIssuerStatus(status: Issuer["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING":
      return "Pending";
    case "SUSPENDED":
      return "Suspended";
    case "REVOKED":
      return "Revoked";
    default:
      return status;
  }
}

export function getIssuerStatusTone(status: Issuer["status"]): "success" | "warning" | "accent" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    case "SUSPENDED":
    case "REVOKED":
      return "warning";
    default:
      return "accent";
  }
}