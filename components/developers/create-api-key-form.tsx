"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { createApiKey, AVAILABLE_SCOPES, type CreateApiKeyResponse } from "@/lib/api/keys";
import { SCOPE_DESCRIPTIONS, type CreateApiKeyInput } from "@/lib/validation/api-keys";

export function CreateApiKeyForm({
  token,
  onKeyCreated,
}: {
  token: string;
  onKeyCreated: (response: CreateApiKeyResponse) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyInput>({
    defaultValues: {
      name: "",
      scopes: [],
      expiresInDays: 90,
    },
  });

  const selectedScopes = watch("scopes") || [];

  const onSubmit = useCallback(async (data: CreateApiKeyInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const controller = new AbortController();
      const response = await createApiKey(token, data, controller.signal);
      onKeyCreated(response);
      reset(); // Clear form after successful creation
    } catch (err) {
      setError("Failed to create API key. Please check your input and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [token, onKeyCreated, reset]);

  const toggleScope = useCallback((scope: string) => {
    const currentScopes = selectedScopes;
    const isSelected = currentScopes.includes(scope);
    
    return isSelected
      ? currentScopes.filter(s => s !== scope)
      : [...currentScopes, scope];
  }, [selectedScopes]);

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Create API Key</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Generate a new API key with specific scopes. Follow the principle of least privilege by selecting only the permissions you need.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="key-name" className="block text-sm font-medium text-slate-200">
              Key Name
            </label>
            <input
              id="key-name"
              type="text"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
              placeholder="My App Integration"
              {...register("name", {
                required: "API key name is required",
                minLength: {
                  value: 3,
                  message: "Name must be at least 3 characters"
                },
                maxLength: {
                  value: 64,
                  message: "Name must be less than 64 characters"
                },
                pattern: {
                  value: /^[a-zA-Z0-9\s\-_.]+$/,
                  message: "Name can only contain letters, numbers, spaces, hyphens, underscores, and periods"
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
            <label htmlFor="expires-in-days" className="block text-sm font-medium text-slate-200">
              Expires In (Days)
            </label>
            <input
              id="expires-in-days"
              type="number"
              min="1"
              max="365"
              className="mt-1 h-11 w-full rounded-md border border-white/10 bg-slate-900 px-4 text-white placeholder:text-slate-400"
              {...register("expiresInDays", {
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "Expiry must be at least 1 day"
                },
                max: {
                  value: 365,
                  message: "Expiry cannot exceed 365 days"
                }
              })}
            />
            {errors.expiresInDays && (
              <p className="mt-1 text-xs text-rose-200" role="alert">
                {errors.expiresInDays.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Optional. Leave empty for no expiration.
            </p>
          </div>
        </div>

        <div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-200">
              Scopes (Select at least one)
            </legend>
            <p className="mt-1 text-xs text-slate-400">
              Grant the minimum permissions required for your integration.
            </p>
            <div className="mt-3 grid gap-3">
              {AVAILABLE_SCOPES.map((scope) => {
                const isChecked = selectedScopes.includes(scope);
                const description = SCOPE_DESCRIPTIONS[scope];
                
                return (
                  <label
                    key={scope}
                    className={`flex gap-3 rounded-md border p-3 cursor-pointer transition ${
                      isChecked
                        ? "border-cyan-300/50 bg-cyan-300/5"
                        : "border-white/10 bg-transparent hover:bg-white/[0.02]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      {...register("scopes", {
                        required: "At least one scope is required"
                      })}
                      onChange={(e) => {
                        const newScopes = e.target.checked
                          ? [...selectedScopes, scope]
                          : selectedScopes.filter(s => s !== scope);
                        // Update the form value
                        handleSubmit(() => {})(); // Trigger validation
                      }}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">
                        {description?.title || scope}
                      </div>
                      {description?.description && (
                        <div className="mt-1 text-xs text-slate-300">
                          {description.description}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-400 font-mono">
                        {scope}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.scopes && (
              <p className="mt-2 text-xs text-rose-200" role="alert">
                {errors.scopes.message}
              </p>
            )}
          </fieldset>
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
          disabled={isSubmitting || selectedScopes.length === 0}
          className="h-10 w-fit rounded-md bg-cyan-300 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-200 transition"
        >
          {isSubmitting ? "Creating..." : "Create API Key"}
        </button>
      </form>
    </section>
  );
}