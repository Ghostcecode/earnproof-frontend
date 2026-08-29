"use client";

import { useCallback, useRef, useState } from "react";
import { PageHeading } from "@/components/common/page-heading";
import { pageContainer } from "@/components/common/production-ui";
import { PublicShell } from "@/components/layout/public-shell";
import { faqData } from "@/lib/faq-data";
import type { FAQItem } from "@/lib/faq-data";

interface FAQItemWithOpen extends FAQItem {
  isOpen: boolean;
}

export default function FAQPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [faqItems, setFaqItems] = useState<FAQItemWithOpen[]>(
    faqData.map((item) => ({ ...item, isOpen: false }))
  );

  // Filter FAQ items based on search query
  const filteredItems = useCallback(() => {
    if (!searchQuery.trim()) {
      return faqItems;
    }

    const query = searchQuery.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery, faqItems]);

  const displayedItems = filteredItems();

  // Toggle accordion open/closed state
  const toggleAccordion = (id: string) => {
    setFaqItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  // Reset search
  const handleClearSearch = () => {
    setSearchQuery("");
    // The "Clear" button unmounts once the query is empty; move focus back
    // to the search field so it isn't lost to <body>.
    searchInputRef.current?.focus();
  };

  // Count stats
  const totalItems = faqData.length;
  const totalCategories = new Set(faqData.map((item) => item.category)).size;

  return (
    <PublicShell>
      <main className={pageContainer}>
        {/* Page Heading */}
        <PageHeading
          title="Frequently asked questions"
          description="Answers for workers, verifiers, issuers, and developers."
        />

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-semibold leading-8">{totalItems}</p>
            <p className="mt-2 text-sm leading-5 text-slate-300">Help topics</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-semibold leading-8">
              {totalCategories}
            </p>
            <p className="mt-2 text-sm leading-5 text-slate-300">Categories</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-semibold leading-8">20 Aug</p>
            <p className="mt-2 text-sm leading-5 text-slate-300">Reviewed</p>
          </article>
        </section>

        {/* Search */}
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <label className="grid flex-1 gap-2 text-xs font-semibold text-slate-300">
              Search
              <input
                type="text"
                placeholder="Search proof type catalogue"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search frequently asked questions"
                className="h-11 rounded-lg border border-white/15 bg-transparent px-3 text-sm font-normal text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                ref={searchInputRef}
              />
            </label>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="h-10 rounded-lg border border-white/15 px-4 text-sm font-medium transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* No Results State */}
        {displayedItems.length === 0 && (
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-slate-300">
              No results found for &quot;{searchQuery}&quot;. Try a different search term.
            </p>
          </section>
        )}

        {/* FAQ List Table */}
        {displayedItems.length > 0 && (
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-2 bg-slate-300/10 p-2 text-xs font-semibold text-slate-300 md:grid">
              <span>Question</span>
              <span>Audience</span>
              <span>Category</span>
              <span>Status</span>
            </div>
            <div className="grid gap-3 md:gap-0">
              {displayedItems.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-2 border border-white/10 p-3 text-sm md:min-h-[58px] md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center md:gap-2 md:px-2"
                >
                  <span className="font-medium text-white md:font-normal">
                    {item.question}
                  </span>
                  <span className="text-slate-300">Public</span>
                  <span className="text-slate-300 capitalize">
                    {item.category}
                  </span>
                  <span className="inline-flex h-7 w-fit items-center rounded-lg border border-cyan-300/50 bg-cyan-300/10 px-1.5 text-xs font-semibold uppercase leading-4 text-cyan-200">
                    Active
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Accordion */}
        {displayedItems.length > 0 && (
          <section className="space-y-3">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-white/10 bg-white/[0.04]"
              >
                <button
                  onClick={() => toggleAccordion(item.id)}
                  aria-expanded={item.isOpen}
                  aria-controls={`answer-${item.id}`}
                  id={`question-${item.id}`}
                  className="w-full px-4 py-4 sm:px-5 sm:py-5 text-left transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-white leading-6">
                        {item.question}
                      </p>
                    </div>
                    <div className="flex-shrink-0 pt-1">
                      <svg
                        className={`h-5 w-5 text-cyan-200 transition-transform ${
                          item.isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Answer Region */}
                <div
                  id={`answer-${item.id}`}
                  role="region"
                  aria-labelledby={`question-${item.id}`}
                  hidden={!item.isOpen}
                  className={`border-t border-white/10 transition-all overflow-hidden ${
                    item.isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="px-4 py-4 sm:px-5 sm:py-5 text-sm leading-6 text-slate-300">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </PublicShell>
  );
}
