import { useState } from "react";
import { z } from "zod";
import { Loader2, Mail, Check } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";

const schema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(80, "First name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "First name has invalid characters"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name required")
    .max(80, "Last name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name has invalid characters"),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().min(5, "Phone required").max(30),
});

export function NewsletterForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update =
    (k: keyof Omit<typeof form, "phone">) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (!isValidPhoneNumber(parsed.data.phone)) {
      toast.error("Enter a valid phone number for the selected country");
      return;
    }
    setLoading(true);
    // Derive country from phone using libphonenumber-js
    const { parsePhoneNumber } = await import("libphonenumber-js");
    const parsedPhone = parsePhoneNumber(parsed.data.phone);
    const country = parsedPhone?.country ?? "";

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ ...parsed.data, country });
    setLoading(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "You're already subscribed with this email."
          : "Couldn't subscribe — try again.",
      );
      return;
    }
    setDone(true);
    setForm({ first_name: "", last_name: "", email: "", phone: "" });
    toast.success("Subscribed! Welcome aboard.");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-8 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-[14px] font-medium text-foreground">You're on the list.</p>
        <p className="text-[12px] text-muted-foreground">
          New docs and posts will land in your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary">
          <Mail className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-display text-[15px] font-medium text-foreground">Newsletter</h3>
          <p className="text-[12px] text-muted-foreground">
            Get new docs, diagrams, and write-ups in your inbox.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field placeholder="First name" value={form.first_name} onChange={update("first_name")} autoComplete="given-name" />
        <Field placeholder="Last name" value={form.last_name} onChange={update("last_name")} autoComplete="family-name" />
        <Field
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={update("email")}
          autoComplete="email"
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <PhoneInput
            defaultCountry="US"
            international
            countryCallingCodeEditable={false}
            value={form.phone}
            onChange={(value) => setForm((f) => ({ ...f, phone: value ?? "" }))}
            placeholder="Phone number"
            className="phone-input"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {loading ? "Subscribing…" : "Subscribe"}
      </button>
      <p className="mt-2 text-[11px] text-muted-foreground">
        We never share your details. Unsubscribe anytime.
      </p>
    </form>
  );
}

function Field({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}
