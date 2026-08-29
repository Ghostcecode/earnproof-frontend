"use client";

import { useCallback, useState } from "react";
import { formatApiKeyPrefix, rotateApiKey, revokeApiKey } from "@/lib/api/keys";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { OneTimeSecret } from "./one-time-secret";
import type { ApiKey } from "@/lib/api/generated/v1";

export function ApiKeyList({
  apiKeys,
  loading,
  token,
  onKeyUpdated,
  onKeyRevoked,
}: {
  apiKeys: ApiKey[];
  loading: boolean;
  token: string;
  onKeyUpdated: (key: ApiKey) => void;
  onKeyRevoked: (keyId: string) => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "rotate" | "revoke";
    keyId: string;
    keyName: string;
  } | null>(null);
  const [rotatedKey, setRotatedKey] = useState<{
    apiKey: ApiKey;
    secret: string;
  } | null>(null);

  const handleRotate = useCallback(async (keyId: string) => {
    setActionLoading(keyId);
    setError(null);
    
    try {
      const controller = new AbortController();
      const response = await rotateApiKey(token, keyId, controller.signal);
      onKeyUpdated(response.apiKey);
      setRotatedKey(response);
    } catch (err) {
      setError("Failed to rotate API key. Please try again.");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }, [token, onKeyUpdated]);

  const handleRevoke = useCallback(async (keyId: string) => {
    setActionLoading(keyId);
    setError(null);
    
    try {
      const controller = new AbortController();
      await revokeApiKey(token, keyId, controller.signal);
      onKeyRevoked(keyId);
    } catch (err) {
      setError("Failed to revoke API key. Please try again.");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }, [token, onKeyRevoked]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && apiKeys.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-slate-950 p-4 text-center">
        <p className="text-sm text-slate-400">Loading API keys...</p>
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-slate-950 p-4 text-center">
        <p className="text-sm text-slate-400">No API keys found. Create your first API key above.</p>
      </div>
    );
  }

  return (
    <>
      {rotatedKey && (
        <OneTimeSecret
          apiKey={rotatedKey.apiKey}
          secret={rotatedKey.secret}
          onDismiss={() => setRotatedKey(null)}
        />
      )}

      <div className="grid gap-3">
        {error && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <p className="text-sm text-rose-200" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Desktop header */}
        <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/10 pb-2 text-xs font-semibold uppercase text-slate-400 md:grid">
          <div>Name & Prefix</div>
          <div>Scopes</div>
          <div>Created</div>
          <div>Expires</div>
          <div>Actions</div>
        </div>

        {apiKeys.map((key) => (
          <ApiKeyRow
            key={key.id}
            apiKey={key}
            isLoading={actionLoading === key.id}
            onRotate={() => 
              setConfirmAction({
                type: "rotate",
                keyId: key.id,
                keyName: key.name,
              })
            }
            onRevoke={() =>
              setConfirmAction({
                type: "revoke",
                keyId: key.id,
                keyName: key.name,
              })
            }
          />
        ))}
      </div>

      {confirmAction && (
        <ConfirmationDialog
          title={confirmAction.type === "rotate" ? "Rotate API Key" : "Revoke API Key"}
          message={
            confirmAction.type === "rotate"
              ? `Are you sure you want to rotate "${confirmAction.keyName}"? The current secret will become invalid immediately and a new secret will be generated.`
              : `Are you sure you want to revoke "${confirmAction.keyName}"? This action cannot be undone and will immediately invalidate the API key.`
          }
          confirmText={confirmAction.type === "rotate" ? "Rotate Key" : "Revoke Key"}
          confirmVariant={confirmAction.type === "rotate" ? "primary" : "danger"}
          onConfirm={() => {
            if (confirmAction.type === "rotate") {
              handleRotate(confirmAction.keyId);
            } else {
              handleRevoke(confirmAction.keyId);
            }
          }}
          onCancel={() => setConfirmAction(null)}
          isProcessing={actionLoading === confirmAction.keyId}
        />
      )}
    </>
  );
}

function ApiKeyRow({
  apiKey,
  isLoading,
  onRotate,
  onRevoke,
}: {
  apiKey: ApiKey;
  isLoading: boolean;
  onRotate: () => void;
  onRevoke: () => void;
}) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-slate-950 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
      {/* Name & Prefix */}
      <div className="min-w-0">
        <div className="font-medium text-white">{apiKey.name}</div>
        <div className="mt-1 font-mono text-xs text-slate-400">
          {formatApiKeyPrefix(apiKey.prefix)}***
        </div>
        {isExpired && (
          <div className="mt-1 text-xs text-rose-300">Expired</div>
        )}
      </div>

      {/* Scopes */}
      <div className="min-w-0">
        <div className="text-slate-300 md:hidden font-semibold">Scopes:</div>
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes.map((scope) => (
            <span
              key={scope}
              className="inline-flex rounded bg-slate-800 px-2 py-1 text-xs text-slate-300"
            >
              {scope}
            </span>
          ))}
        </div>
      </div>

      {/* Created */}
      <div>
        <div className="text-slate-300 md:hidden font-semibold">Created:</div>
        <div className="text-slate-400">
          {/* Using a placeholder date since it's not in the API response */}
          Recently
        </div>
      </div>

      {/* Expires */}
      <div>
        <div className="text-slate-300 md:hidden font-semibold">Expires:</div>
        <div className={`${isExpired ? "text-rose-300" : "text-slate-400"}`}>
          {formatDate(apiKey.expiresAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRotate}
          disabled={isLoading}
          className="h-8 rounded border border-white/15 px-3 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50 transition"
        >
          {isLoading ? "..." : "Rotate"}
        </button>
        <button
          onClick={onRevoke}
          disabled={isLoading}
          className="h-8 rounded border border-rose-300/30 px-3 text-xs font-medium text-rose-200 hover:bg-rose-300/10 disabled:opacity-50 transition"
        >
          {isLoading ? "..." : "Revoke"}
        </button>
      </div>
    </div>
  );
}