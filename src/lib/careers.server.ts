import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { CareerApplication } from "@/server/models";
import { connectMongo, safeMongoError } from "@/server/mongo";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const allowedPositions = new Set([
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "UI/UX Designer",
  "Digital Marketing Executive", "SEO Specialist", "Business Development Executive",
  "Sales & Partnerships Associate", "Real Estate Operations Executive", "Customer Success Executive",
  "General Application",
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d().\s-]{7,40}$/;

function fail(message: string, status: number) {
  return Response.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function submitCareerApplication(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESUME_BYTES + 128 * 1024) return fail("Your application is too large. Resume files must be no larger than 5 MB.", 413);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail("Invalid request origin.", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Please submit the application form again.", 400);
  }

  // Quietly accept bot honeypot submissions without persisting them.
  if (String(form.get("website") ?? "").trim())
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });

  const fullName = String(form.get("fullName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const position = String(form.get("position") ?? "").trim();
  const linkedin = String(form.get("linkedin") ?? "").trim();
  const introduction = String(form.get("introduction") ?? "").trim();
  const resume = form.get("resume");

  if (fullName.length < 2 || fullName.length > 120) return fail("Enter your full name (2–120 characters).", 400);
  if (email.length > 254 || !emailPattern.test(email)) return fail("Enter a valid email address.", 400);
  if (!phonePattern.test(phone)) return fail("Enter a valid phone number.", 400);
  if (!allowedPositions.has(position)) return fail("Select a listed role or general application.", 400);
  if (introduction.length < 20 || introduction.length > 2000)
    return fail("Your introduction must be between 20 and 2,000 characters.", 400);
  if (linkedin) {
    try {
      const url = new URL(linkedin);
      if (url.protocol !== "https:" || !/(^|\.)linkedin\.com$/i.test(url.hostname)) throw new Error();
    } catch {
      return fail("Enter a valid LinkedIn profile URL.", 400);
    }
  }
  if (!(resume instanceof File)) return fail("Upload your resume as a PDF.", 400);
  if (resume.size < 8 || resume.size > MAX_RESUME_BYTES) return fail("Your PDF must be no larger than 5 MB.", 400);
  if (resume.type !== "application/pdf") return fail("Only PDF resumes are accepted.", 400);

  const resumeBytes = new Uint8Array(await resume.arrayBuffer());
  const signature = new TextDecoder().decode(resumeBytes.subarray(0, 5));
  if (signature !== "%PDF-") return fail("The uploaded file is not a valid PDF.", 400);

  try {
    await connectMongo();
    await CareerApplication.create({
      fullName,
      email,
      phone,
      position,
      resume: Buffer.from(resumeBytes),
      resumeContentType: "application/pdf",
      resumeFilename: `${randomUUID()}.pdf`,
      ...(linkedin ? { linkedinUrl: linkedin } : {}),
      introduction,
    });
  } catch (error) {
    console.error("[Careers] Application save failed:", safeMongoError(error));
    return fail("We could not save your application. Please try again later.", 503);
  }

  return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
