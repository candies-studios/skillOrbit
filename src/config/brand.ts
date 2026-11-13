/**
 * Brand configuration. "SkillOrbit" is a working name — change it here and
 * in globals.css tokens to rebrand. Nothing else should hardcode the name.
 *
 * Contact details come from public env vars. When they are missing we show
 * an explicit "not configured" state instead of inventing an address.
 */
export const brand = {
  name: "SkillOrbit",
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "",
  tagline: "Practical digital skills, taught by people who use them.",
  description:
    "SkillOrbit is an online school for practical digital skills — AI, marketing, freelancing, e-commerce, content and business finance — built for learners in India and around the world.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  postalAddress: process.env.NEXT_PUBLIC_POSTAL_ADDRESS || "",
  grievanceOfficerEmail: process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  defaultCurrency: "INR" as const,
  defaultLocale: "en-IN",
} as const;

export type Brand = typeof brand;
