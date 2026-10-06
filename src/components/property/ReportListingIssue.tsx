import { Flag, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { supabase } from "@/integrations/supabase/client";

type IssueType = "price" | "availability" | "details" | "source" | "other";

const fieldClass =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export function ReportListingIssue({
  listingId,
  compact = false,
}: {
  listingId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>("availability");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("listing_issue_reports").insert({
      listing_id: listingId,
      issue_type: issueType,
      description: description.trim(),
      contact_email: contactEmail.trim() || null,
    });

    setSubmitting(false);
    if (insertError) {
      setError("Your report could not be submitted. Please try again later.");
      return;
    }
    setSent(true);
  };

  return (
    <section
      className={
        compact ? "relative z-10 mt-4 border-t border-border pt-4" : "mt-8 border-t border-border pt-6"
      }
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        Report an issue
      </Button>

      {open ? (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          {sent ? (
            <p role="status" className="text-sm font-medium text-success">
              Thank you. Your report has been submitted for review.
            </p>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
              <div>
                <label htmlFor={`issue-type-${listingId}`} className="mb-1.5 block text-sm font-medium">
                  What needs attention?
                </label>
                <select
                  id={`issue-type-${listingId}`}
                  className={fieldClass}
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value as IssueType)}
                >
                  <option value="availability">Availability or status</option>
                  <option value="price">Price</option>
                  <option value="details">Property details</option>
                  <option value="source">Source link</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor={`issue-description-${listingId}`} className="mb-1.5 block text-sm font-medium">
                  Details
                </label>
                <textarea
                  id={`issue-description-${listingId}`}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-card p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`issue-email-${listingId}`} className="mb-1.5 block text-sm font-medium">
                  Email for follow-up (optional)
                </label>
                <input
                  id={`issue-email-${listingId}`}
                  type="email"
                  maxLength={254}
                  className={fieldClass}
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit report
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}
