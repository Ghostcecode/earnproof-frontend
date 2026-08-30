"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeading } from "@/components/common/page-heading";
import { MetricGrid, StatusBadge, pageContainer } from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";
import { proofTypes, searchProofTypes, getProofTypeStats, type ProofType } from "@/data/proof-types";

function ProofTypeCard({ proofType }: { proofType: ProofType }) {
  const isAvailable = proofType.status === "available";
  
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold leading-7 text-white">{proofType.name}</h3>
          <p className="text-sm text-slate-300 mt-1">{proofType.category}</p>
        </div>
        <StatusBadge tone={isAvailable ? "success" : "warning"}>
          {proofType.status}
        </StatusBadge>
      </div>
      
      <p className="text-sm leading-6 text-slate-300 mb-4">
        {proofType.description}
      </p>
      
      <div className="space-y-3 mb-5">
        <div>
          <dt className="text-xs font-semibold uppercase text-slate-400 mb-1">Requirements</dt>
          <dd className="text-sm text-slate-300">
            <ul className="space-y-1">
              {proofType.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400 mb-1">Time estimate</dt>
            <dd className="text-sm text-slate-300">{proofType.estimatedTime}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400 mb-1">Networks</dt>
            <dd className="text-sm text-slate-300">{proofType.supportedNetworks.join(", ")}</dd>
          </div>
        </div>
      </div>
      
      {isAvailable ? (
        <Link 
          href="/proofs/create"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-cyan-300/50 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
        >
          Create proof
        </Link>
      ) : (
        <button 
          disabled
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-400/30 bg-slate-400/10 px-6 text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          Coming soon
        </button>
      )}
    </article>
  );
}

function ProofTypeRow({ proofType }: { proofType: ProofType }) {
  const isAvailable = proofType.status === "available";
  
  return (
    <article className="grid gap-2 border border-white/10 p-3 text-sm md:min-h-[58px] md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center md:gap-2 md:px-2">
      <div className="min-w-0">
        <div className="font-medium text-white md:font-normal">{proofType.name}</div>
        <div className="text-slate-400 text-xs md:hidden">{proofType.category}</div>
      </div>
      <span className="text-slate-300 hidden md:block">{proofType.category}</span>
      <span className="text-slate-300 hidden md:block">{proofType.estimatedTime}</span>
      <div className="flex items-center justify-between md:justify-start md:gap-3">
        <StatusBadge tone={isAvailable ? "success" : "warning"}>
          {proofType.status}
        </StatusBadge>
        {isAvailable ? (
          <Link 
            href="/proofs/create"
            className="text-sm text-cyan-300 hover:text-cyan-200 underline md:no-underline md:hover:underline"
          >
            Create
          </Link>
        ) : (
          <span className="text-sm text-slate-400">Coming soon</span>
        )}
      </div>
    </article>
  );
}

function NoResults() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <h3 className="text-lg font-semibold text-white mb-2">No proof types found</h3>
      <p className="text-sm text-slate-300 mb-4">
        Try adjusting your search terms or browse all available proof types.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="text-sm text-cyan-300 hover:text-cyan-200 underline"
      >
        Clear search
      </button>
    </div>
  );
}

export default function ProofTypesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  const filteredTypes = searchProofTypes(proofTypes, searchQuery);
  const stats = getProofTypeStats(proofTypes);

  return (
    <PublicShell>
      <div className={pageContainer}>
        <PageHeading
          title="Proof types"
          description="Browse available proof types and create verifiable credentials for different use cases."
        />

        <MetricGrid
          items={[
            { value: stats.total.toString(), label: "Total types" },
            { value: stats.available.toString(), label: "Available now" },
            { value: stats.planned.toString(), label: "Coming soon" },
          ]}
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="grid gap-2 text-xs font-semibold text-slate-300 sm:max-w-[370px] flex-1">
              Search proof types
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[46px] rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-white placeholder:text-slate-400"
                placeholder="Search by name, description, or category..."
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("cards")}
                className={`h-10 px-4 text-sm font-medium rounded-lg border transition ${
                  viewMode === "cards"
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                    : "border-white/15 text-slate-300 hover:bg-white/10"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`h-10 px-4 text-sm font-medium rounded-lg border transition ${
                  viewMode === "table"
                    ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                    : "border-white/15 text-slate-300 hover:bg-white/10"
                }`}
              >
                Table
              </button>
            </div>
          </div>

          {filteredTypes.length === 0 ? (
            <NoResults />
          ) : viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTypes.map((proofType) => (
                <ProofTypeCard key={proofType.id} proofType={proofType} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="hidden grid-cols-[1.3fr_1fr_1fr_1fr] gap-2 bg-slate-300/10 p-2 text-xs font-semibold text-slate-300 md:grid mb-3">
                <span>Name</span>
                <span>Category</span>
                <span>Time estimate</span>
                <span>Status</span>
              </div>
              <div className="grid gap-3 md:gap-0">
                {filteredTypes.map((proofType) => (
                  <ProofTypeRow key={proofType.id} proofType={proofType} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}