"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { createOrganization } from "@/lib/api/organizations";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/lib/validation/organizations";
import type { Organization } from "@/lib/api/generated/v1";

export function CreateOrganizationForm({
  token,
  onOrganizationCreated,
}: {
  token: string;
  onOrganizationCreated: (organization: Organization) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationInput>();

  const onSubmit = useCallback(async (data: CreateOrganizationInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate with Zod schema
      const validated = createOrganizationSchema.parse(data);
      
      const controller = new AbortController();
      const organization = await createOrganization(token, validated, controller.signal);
      onOrganizationCreated(organization);
      reset(); // Clear form after successful creation
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create organization. Please check your input and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [token, onOrganizationCreated, reset]);

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove invalid characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }, []);

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Create Organization</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Create a new organization with proper administrative oversight and metadata management.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium text-slate-200">
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
              placeholder="Acme Corporation"
              {...register("name", {
                required: "Organization name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters"
                },
                maxLength: {
                  value: 100,
                  message: "Name must be less than 100 characters"
                },
                onChange: (e) => {
                  // Auto-generate slug from name
                  const slugField = document.getElementById('org-slug') as HTMLInputElement;
                  if (slugField && !slugField.value) {
                    const slug = generateSlug(e.target.value);
                    slugField.value = slug;
                  }
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
            <label htmlFor="org-slug" className="block text-sm font-medium text-slate-200">
              Slug
            </label>
            <input
              id="org-slug"
              type="text"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
              placeholder="acme-corporation"
              {...register("slug", {
                required: "Organization slug is required",
                minLength: {
                  value: 3,
                  message: "Slug must be at least 3 characters"
                },
                maxLength: {
                  value: 50,
                  message: "Slug must be less than 50 characters"
                },
                pattern: {
                  value: /^[a-z0-9-]+$/,
                  message: "Slug can only contain lowercase letters, numbers, and hyphens"
                },
                validate: (value) => {
                  if (value.startsWith('-') || value.endsWith('-')) {
                    return "Slug cannot start or end with a hyphen";
                  }
                  if (value.includes('--')) {
                    return "Slug cannot contain consecutive hyphens";
                  }
                  return true;
                }
              })}
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-rose-200" role="alert">
                {errors.slug.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Used in URLs and API endpoints. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="org-website" className="block text-sm font-medium text-slate-200">
            Website (Optional)
          </label>
          <input
            id="org-website"
            type="url"
            className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
            placeholder="https://acme.com"
            {...register("website", {
              validate: (value) => {
                if (!value || value.trim() === '') return true;
                try {
                  const url = new URL(value);
                  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    return "Website URL must use http or https protocol";
                  }
                  return true;
                } catch {
                  return "Please enter a valid website URL";
                }
              }
            })}
          />
          {errors.website && (
            <p className="mt-1 text-xs text-rose-200" role="alert">
              {errors.website.message}
            </p>
          )}
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
          {isSubmitting ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </section>
  );
}