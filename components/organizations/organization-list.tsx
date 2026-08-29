"use client";

import { useCallback, useState } from "react";
import { updateOrganization, formatOrganizationStatus, getStatusTone } from "@/lib/api/organizations";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import { StatusBadge } from "@/components/common/production-ui";
import type { Organization } from "@/lib/api/generated/v1";

export function OrganizationList({
  organizations,
  loading,
  token,
  onOrganizationUpdated,
}: {
  organizations: Organization[];
  loading: boolean;
  token: string;
  onOrganizationUpdated: (organization: Organization) => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "activate" | "revoke";
    organizationId: string;
    organizationName: string;
  } | null>(null);

  const handleStatusUpdate = useCallback(async (
    organizationId: string,
    newStatus: Organization["status"]
  ) => {
    setActionLoading(organizationId);
    setError(null);
    
    try {
      const controller = new AbortController();
      const updated = await updateOrganization(
        token,
        organizationId,
        { status: newStatus },
        controller.signal
      );
      onOrganizationUpdated(updated);
    } catch (err) {
      setError("Failed to update organization status. Please try again.");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }, [token, onOrganizationUpdated]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-slate-950 p-4 text-center">
        <p className="text-sm text-slate-400">Loading organizations...</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-md border border-white/10 bg-slate-950 p-4 text-center">
        <p className="text-sm text-slate-400">No organizations found. Create your first organization above.</p>
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
          <div>Organization</div>
          <div>Status</div>
          <div>Created</div>
          <div>Actions</div>
        </div>

        {organizations.map((org) => (
          <OrganizationRow
            key={org.id}
            organization={org}
            isLoading={actionLoading === org.id}
            onSuspend={() => 
              setConfirmAction({
                type: "suspend",
                organizationId: org.id,
                organizationName: org.name,
              })
            }
            onActivate={() => 
              setConfirmAction({
                type: "activate",
                organizationId: org.id,
                organizationName: org.name,
              })
            }
            onRevoke={() =>
              setConfirmAction({
                type: "revoke",
                organizationId: org.id,
                organizationName: org.name,
              })
            }
          />
        ))}
      </div>

      {confirmAction && (
        <ConfirmationDialog
          title={`${confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)} Organization`}
          message={
            confirmAction.type === "revoke"
              ? `Are you sure you want to revoke "${confirmAction.organizationName}"? This action cannot be undone and will permanently disable the organization.`
              : confirmAction.type === "suspend"
              ? `Are you sure you want to suspend "${confirmAction.organizationName}"? This will temporarily disable organization operations.`
              : `Are you sure you want to activate "${confirmAction.organizationName}"? This will enable organization operations.`
          }
          confirmText={confirmAction.type.charAt(0).toUpperCase() + confirmAction.type.slice(1)}
          confirmVariant={confirmAction.type === "revoke" ? "danger" : "primary"}
          onConfirm={() => {
            const statusMap = {
              suspend: "SUSPENDED" as const,
              activate: "ACTIVE" as const,
              revoke: "REVOKED" as const,
            };
            handleStatusUpdate(confirmAction.organizationId, statusMap[confirmAction.type]);
          }}
          onCancel={() => setConfirmAction(null)}
          isProcessing={actionLoading === confirmAction.organizationId}
        />
      )}
    </>
  );
}

function OrganizationRow({
  organization,
  isLoading,
  onSuspend,
  onActivate,
  onRevoke,
}: {
  organization: Organization;
  isLoading: boolean;
  onSuspend: () => void;
  onActivate: () => void;
  onRevoke: () => void;
}) {
  const canSuspend = organization.status === "ACTIVE";
  const canActivate = organization.status === "SUSPENDED" || organization.status === "PENDING";
  const canRevoke = organization.status !== "REVOKED" && organization.status !== "DELETED";

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-slate-950 p-4 text-sm md:grid-cols-[2fr_1fr_1fr_auto] md:items-center md:gap-4">
      {/* Organization Info */}
      <div className="min-w-0">
        <div className="font-medium text-white">{organization.name}</div>
        <div className="mt-1 font-mono text-xs text-slate-400">
          {organization.slug}
        </div>
        {organization.website && (
          <div className="mt-1 text-xs">
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200 transition"
            >
              {organization.website}
            </a>
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <div className="text-slate-300 md:hidden font-semibold">Status:</div>
        <StatusBadge tone={getStatusTone(organization.status)}>
          {formatOrganizationStatus(organization.status)}
        </StatusBadge>
      </div>

      {/* Created */}
      <div>
        <div className="text-slate-300 md:hidden font-semibold">Created:</div>
        <div className="text-slate-400">
          {/* Using placeholder since creation date is not in API response */}
          Recently
        </div>
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