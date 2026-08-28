import { apiClient, bearer, retryRead, retryMutation } from "./client";
import type { ApiKey } from "./generated/v1";

export type CreateApiKeyRequest = {
  name: string;
  scopes: string[];
  expiresInDays?: number;
};

export type CreateApiKeyResponse = {
  apiKey: ApiKey;
  secret: string; // Only returned once on creation
};

export type RotateApiKeyResponse = {
  apiKey: ApiKey;
  secret: string; // Only returned once on rotation
};

export const AVAILABLE_SCOPES = [
  "verification:read",
  "proofs:create", 
  "proofs:read",
  "webhooks:manage"
] as const;

export async function getApiKeys(token: string, signal: AbortSignal): Promise<ApiKey[]> {
  return retryRead(async (signal) => {
    return apiClient<ApiKey[]>({
      path: "/api-keys",
      method: "GET",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export async function createApiKey(
  token: string,
  request: CreateApiKeyRequest,
  signal: AbortSignal
): Promise<CreateApiKeyResponse> {
  return retryMutation(async (signal) => {
    return apiClient<CreateApiKeyResponse>({
      path: "/api-keys",
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(request),
      signal,
    });
  }, signal);
}

export async function rotateApiKey(
  token: string,
  keyId: string,
  signal: AbortSignal
): Promise<RotateApiKeyResponse> {
  return retryMutation(async (signal) => {
    return apiClient<RotateApiKeyResponse>({
      path: `/api-keys/${keyId}/rotate`,
      method: "POST",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export async function revokeApiKey(
  token: string,
  keyId: string,
  signal: AbortSignal
): Promise<void> {
  return retryMutation(async (signal) => {
    await apiClient({
      path: `/api-keys/${keyId}`,
      method: "DELETE",
      headers: bearer(token),
      signal,
    });
  }, signal);
}

export function formatApiKeyPrefix(prefix: string): string {
  return prefix.length > 8 ? `${prefix.slice(0, 8)}...` : prefix;
}

export function validateApiKeyName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "API key name is required";
  }
  if (trimmed.length < 3) {
    return "API key name must be at least 3 characters";
  }
  if (trimmed.length > 64) {
    return "API key name must be less than 64 characters";
  }
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmed)) {
    return "API key name can only contain letters, numbers, spaces, hyphens, underscores, and periods";
  }
  return null;
}

export function validateApiKeyScopes(scopes: string[]): string | null {
  if (scopes.length === 0) {
    return "At least one scope is required";
  }
  
  const invalidScopes = scopes.filter(scope => !AVAILABLE_SCOPES.includes(scope as any));
  if (invalidScopes.length > 0) {
    return `Invalid scopes: ${invalidScopes.join(", ")}`;
  }
  
  return null;
}