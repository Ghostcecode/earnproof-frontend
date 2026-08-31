"use client";

import { useState } from "react";
import Image from "next/image";

type ContactFormData = {
  name: string;
  email: string;
  category: "general" | "technical" | "business" | "security";
  message: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  category?: string;
  message?: string;
};

function validateContactForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (data.name.length > 100) {
    errors.name = "Name must not exceed 100 characters";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(data.email)) {
    errors.email = "Please enter a valid email address";
  } else if (data.email.length > 255) {
    errors.email = "Email must not exceed 255 characters";
  }

  // Category validation
  const validCategories = ["general", "technical", "business", "security"];
  if (!validCategories.includes(data.category)) {
    errors.category = "Please select a valid category";
  }

  // Message validation
  if (!data.message || data.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters";
  } else if (data.message.length > 1000) {
    errors.message = "Message must not exceed 1000 characters";
  }

  return errors;
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    category: "general",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const messageLength = formData.message.length;

  const handleChange = (
    field: keyof ContactFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateContactForm(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      category: true,
      message: true,
    });

    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Construct mailto link with form data
    const subject = encodeURIComponent(
      `[${formData.category.toUpperCase()}] Contact from ${formData.name}`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCategory: ${formData.category}\n\nMessage:\n${formData.message}`
    );
    const mailtoLink = `mailto:contact@earnproof.com?subject=${subject}&body=${body}`;

    // Open user's default email client in the current browsing context
    window.open(mailtoLink, "_self");
  };

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <Image
          src="/logo.svg"
          alt="EarnProof"
          width={32}
          height={32}
          className="mt-1"
        />
        <div className="flex-1">
          <h2 className="text-xl font-semibold leading-7 text-white">
            Send a message
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-300">
            This form opens your email client with a pre-filled message. No data is sent or stored by EarnProof.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Field */}
        <div className="grid gap-2">
          <label
            htmlFor="name"
            className="text-xs font-semibold text-slate-300"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="h-11 rounded-lg border border-white/15 bg-transparent px-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            placeholder="Your full name"
          />
          {touched.name && errors.name && (
            <p
              id="name-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-slate-300"
          >
            Reply email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-11 rounded-lg border border-white/15 bg-transparent px-3 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            placeholder="your@email.com"
          />
          {touched.email && errors.email && (
            <p
              id="email-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {errors.email}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div className="grid gap-2">
          <label
            htmlFor="category"
            className="text-xs font-semibold text-slate-300"
          >
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              handleChange(
                "category",
                e.target.value as ContactFormData["category"]
              )
            }
            onBlur={() => handleBlur("category")}
            aria-invalid={errors.category ? "true" : "false"}
            aria-describedby={errors.category ? "category-error" : undefined}
            className="h-11 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <option value="general">General inquiry</option>
            <option value="technical">Technical support</option>
            <option value="business">Business partnership</option>
            <option value="security">Security issue</option>
          </select>
          {touched.category && errors.category && (
            <p
              id="category-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {errors.category}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="message"
              className="text-xs font-semibold text-slate-300"
            >
              Message
            </label>
            <span
              className={`text-xs ${
                messageLength > 1000
                  ? "text-red-400"
                  : messageLength > 900
                  ? "text-amber-300"
                  : "text-slate-400"
              }`}
              aria-live="polite"
            >
              {messageLength}/1000
            </span>
          </div>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            aria-invalid={errors.message ? "true" : "false"}
            aria-describedby={errors.message ? "message-error" : undefined}
            rows={6}
            className="rounded-lg border border-white/15 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            placeholder="Describe your inquiry in detail..."
          />
          {touched.message && errors.message && (
            <p
              id="message-error"
              role="alert"
              className="text-xs text-red-400"
            >
              {errors.message}
            </p>
          )}
        </div>

        {/* Info Banner */}
        <div className="rounded-lg border border-cyan-300/50 bg-cyan-300/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            How it works
          </p>
          <p className="mt-1.5 text-sm leading-5 text-slate-300">
            Clicking &quot;Send message&quot; opens your default email client with a pre-filled message to contact@earnproof.com.
            You can review and edit before sending. No message content is stored or transmitted by this website.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-cyan-300/50 bg-cyan-300 px-6 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Send message
        </button>
      </form>
    </section>
  );
}
