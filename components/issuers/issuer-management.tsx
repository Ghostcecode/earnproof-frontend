"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreateIssuerForm } from "./create-issuer-form";
import { IssuerList } from "./issuer-list";
import { getIssuers } from "@/lib/api/issuers";
import { getOrganizations } from "@/lib/api/organizations";
import type { Issuer, Organization } from "@/lib/api/generated/v1";

const SESSION_KEY = "earnproof.session";

type SessionData = {
  token: string;
  user: {
    id: string;
    role: string;
  };
};

function readStoredSession(): SessionData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as SessionData;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function IssuerManagement() {
  const [session, setSession] = useState<SessionData | null>(() => readStoredSession());
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.token) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [issuersData, orgsData] = await Promise.all([
        getIssuers(session.token, controller.signal),
        getOrganizations(session.token, controller.signal),
      ]);
      
      if (!controller.signal.aborted) {
        setIssuers(issuersData);
        setOrganizations(orgsData);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError("Failed to load issuers and organizations. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [session?.token]);

  useEffect(() => {
    loadData();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  const handleIssuerCreated = useCallback((issuer: Issuer) => {
    setIssuers(prev => [...prev, issuer]);
  }, []);

  const handleIssuerUpdated = useCallback((updatedIssuer: Issuer) => {
    setIssuers(prev => prev.map(issuer => 
      issuer.id === updatedIssuer.id ? updatedIssuer : issuer
    ));
  }, []);

  // Check if user has admin role
  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "ISSUER";

  if (!session) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-xl font-semibold text-white">Authentication Required</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Please authenticate with a Stellar wallet to access issuer management.
        </p>
        <a
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
          href="/proofs/create"
        >
          Connect Wallet
        </a>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-5">
        <h2 className="text-xl font-semibold text-amber-100">Access Restricted</h2>
        <p className="mt-2 text-sm leading-6 text-amber-200">
          Issuer management requires administrative access. Contact your administrator if you need access to issuer management tools.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:gap-10">
      <CreateIssuerForm 
        token={session.token}
        organizations={organizations}
        onIssuerCreated={handleIssuerCreated}
      />

      <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Issuers</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Manage issuers, their organizational relationships, and administrative status.
            </p>
          </div>
          <button
            className="h-10 rounded-md border border-white/15 px-4 text-xs font-semibold text-white disabled:opacity-50"
            disabled={loading}
            onClick={loadData}
            type="button"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <p className="text-sm text-rose-200" role="alert">
              {error}
            </p>
          </div>
        )}

        <IssuerList
          issuers={issuers}
          organizations={organizations}
          loading={loading}
          token={session.token}
          onIssuerUpdated={handleIssuerUpdated}
        />
      </section>
    </div>
  );
}