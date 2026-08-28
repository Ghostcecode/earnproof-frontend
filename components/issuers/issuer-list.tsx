"use client";

import { useCallback, useState } from "react";
import { updateIssuer, formatIssuerStatus, getIssuerStatusTone } from "@/lib/api/issuers";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { StatusBadge } from "@/components/common/production-ui";
import type { Issuer, Organization } from "@/lib/api/generated/v1";

export function IssuerList({
  issuers,
  organizations,
  loading,
  token,
  onIssuerUpdated,
}: {
  issuers: Issuer[];
  organizations: Organization[];
  loading: boolean;
  token: string;
  onIssuerUpdated: (issuer: Issuer) => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "revoke";
    issuerId: string;
    issuerName: string;
  } | null>(null);

  const handleStatusUpdate = useCallback(async (
    issuerId: string,
    newStatus: Issuer["status"]
  ) => {
    setActionLoading(issuerId);
    setError(null);
    
    try {
      const controller = new AbortController();
      const updated = await updateIssuer(
        token,
        issuerId,
        { status: newStatus },
        controller.signal
      );
      onIssuerUpdated(updated);
    } catch (err) {
      setError("Failed to update issuer status. Please try again.");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }, [token, onIssuerUpdated]);

  const getOrganizationName = useCallback((organizationId?: string) => {
    if (!organizationId) return "Independent";
    const org = organizations.find(o => o.id === organizationId);
    return org?.name || "Unknown Organization";
  }, [organizations]);

  if (loading && issuers.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-slate-950 p-4 text-center">
        <p className="text-sm text-slate-400">Loading issuers...</p>
      </div>
    );
  }

  if (issuers.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-slate-950 p-4 text-center">
        <p className="text-sm text-slate-400">No issuers found. Create your first issuer above.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {error && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <p className="text-sm text-rose-200" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Desktop header */}
        <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-white/10 pb-2 text-xs font-semibold uppercase text-slate-400 md:grid">
          <div>Issuer</div>
          <div>Organization</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {issuers.map((issuer) => (
          <IssuerRow
            key={issuer.id}
            issuer={issuer}
            organizationName={getOrganizationName(issuer.organizationId)}
            isLoading={actionLoading === issuer.id}
            onSuspend={() => 
              setConfirmAction({
                type: "suspend",
                issuerId: issuer.id,
                issuerName: issuer.name,
              })
            }
            onActivate={() => 
              setConfirmAction({
                type: "activate",
                issuerId: issuer.id,
                issuerName: issuer.name,
              })
            }
            onRevoke={() =>
              setConfirmAction({
                type: "revoke",
                issuerId: issuer.id,
                issuerName: issuer.name,
              })
            }
          />
        ))}
      </div>

      {confirmAction && (
        <ConfirmationDialog
          title={`${confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)} Issuer`}
          message={
            confirmAction.type === "revoke"
              ? `Are you sure you want to revoke "${confirmAction.issuerName}"? This action cannot be undone and will permanently disable the issuer.`
              : confirmAction.type === "suspend"
              ? `Are you sure you want to suspend "${confirmAction.issuerName}"? This will temporarily disable issuer operations.`
              : `Are you sure you want to activate "${confirmAction.issuerName}"? This will enable issuer operations.`
          }
          confirmText={confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}
          confirmVariant={confirmAction.type === "revoke" ? "danger" : "primary"}
          onConfirm={() => {
            const statusMap = {
              suspend: "SUSPENDED" as const,
              activate: "ACTIVE" as const,
              revoke: "REVOKED" as const,
            };
            handleStatusUpdate(confirmAction.issuerId, statusMap[confirmAction.type]);
          }}
          onCancel={() => setConfirmAction(null)}
          isProcessing={actionLoading === confirmAction.issuerId}
        />
      )}
    </>
  );
}

function IssuerRow({
  issuer,
  organizationName,
  isLoading,
  onSuspend,
  onActivate,
  onRevoke,
}: {
  issuer: Issuer;
  organizationName: string;
  isLoading: boolean;
  onSuspend: () => void;
  onActivate: () => void;
  onRevoke: () => void;
}) {
  const canSuspend = issuer.status === "ACTIVE";
  const canActivate = issuer.status === "SUSPENDED" || issuer.status === "PENDING";
  const canRevoke = issuer.status !== "REVOKED";

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-slate-950 p-4 text-sm md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:gap-4">
      {/* Issuer Info */}
      <div className="min-w-0">
        <div className="font-medium text-white">{issuer.name}</div>
        <div className="mt-1 font-mono text-xs text-slate-400">
          ID: {issuer.id}
        </div>
      </div>

      {/* Organization */}
      <div>
        <div className="text-slate-300 md:hidden font-semibold">Organization:</div>
        <div className="text-slate-300">{organizationName}</div>
      </div>

      {/* Status */}
      <div>
        <div className="text-slate-300 md:hidden font-semibold">Status:</div>
        <StatusBadge tone={getIssuerStatusTone(issuer.status)}>
          {formatIssuerStatus(issuer.status)}
        </StatusBadge>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canActivate && (
          <button
            onClick={onActivate}
            disabled={isLoading}
            className="h-8 rounded border border-emerald-300/30 px-3 text-xs font-medium text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-50 transition"
          >
            {isLoading ? "..." : "Activate"}
          </button>
        )}
        {canSuspend && (
          <button
            onClick={onSuspend}
            disabled={isLoading}
            className="h-8 rounded border border-amber-300/30 px-3 text-xs font-medium text-amber-200 hover:bg-amber-300/10 disabled:opacity-50 transition"
          >
            {isLoading ? "..." : "Suspend"}
          </button>
        )}
        {canRevoke && (
          <button
            onClick={onRevoke}
            disabled={isLoading}
            className="h-8 rounded border border-rose-300/30 px-3 text-xs font-medium text-rose-200 hover:bg-rose-300/10 disabled:opacity-50 transition"
          >
            {isLoading ? "..." : "Revoke"}
          </button>
        )}
      </div>
    </div>
  );
}