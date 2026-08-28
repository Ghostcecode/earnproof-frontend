"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { createIssuer } from "@/lib/api/issuers";
import { createIssuerSchema, type CreateIssuerInput } from "@/lib/validation/issuers";
import type { Issuer, Organization } from "@/lib/api/generated/v1";

export function CreateIssuerForm({
  token,
  organizations,
  onIssuerCreated,
}: {
  token: string;
  organizations: Organization[];
  onIssuerCreated: (issuer: Issuer) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIssuerInput>();

  const onSubmit = useCallback(async (data: CreateIssuerInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate with Zod schema
      const validated = createIssuerSchema.parse(data);
      
      const controller = new AbortController();
      const issuer = await createIssuer(token, validated, controller.signal);
      onIssuerCreated(issuer);
      reset(); // Clear form after successful creation
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create issuer. Please check your input and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [token, onIssuerCreated, reset]);

  const activeOrganizations = organizations.filter(org => org.status === "ACTIVE");

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Create Issuer</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Create a new issuer with organizational association and proper administrative oversight.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="issuer-name" className="block text-sm font-medium text-slate-200">
              Issuer Name
            </label>
            <input
              id="issuer-name"
              type="text"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
              placeholder="Veridatum Labs"
              {...register("name", {
                required: "Issuer name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters"
                },
                maxLength: {
                  value: 100,
                  message: "Name must be less than 100 characters"
                }
              })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-200" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="organization-id" className="block text-sm font-medium text-slate-200">
              Organization (Optional)
            </label>
            <select
              id="organization-id"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white"
              {...register("organizationId")}
            >
              <option value="">No organization</option>
              {activeOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {errors.organizationId && (
              <p className="mt-1 text-xs text-rose-200" role="alert">
                {errors.organizationId.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Associate this issuer with an organization for administrative grouping.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3">
            <p className="text-sm text-rose-200" role="alert">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-fit rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-200 transition"
        >
          {isSubmitting ? "Creating..." : "Create Issuer"}
        </button>
      </form>
    </section>
  );
}