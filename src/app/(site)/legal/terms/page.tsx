import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Placeholder } from "@/components/marketing/legal-page";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions" updated="14 November 2026">
      <p>
        These terms govern your use of {brand.name}, operated by{" "}
        <Placeholder value={brand.legalName} label="legal entity name" /> (“we”, “us”). By creating an account or buying
        a course, you agree to them.
      </p>

      <h2>1. Accounts</h2>
      <ul>
        <li>You must give accurate information and keep your password secure.</li>
        <li>You must be at least 18, or have a parent or guardian’s consent to use the platform.</li>
        <li>
          One account can hold student, instructor and affiliate roles. Instructor and affiliate roles require our
          approval.
        </li>
        <li>We may suspend accounts that break these terms, after notice where reasonable.</li>
      </ul>

      <h2>2. Courses and access</h2>
      <ul>
        <li>
          Buying a course gives you a personal, non-transferable licence to access it for as long as it is offered on
          the platform.
        </li>
        <li>Membership gives access to membership-eligible courses only while your membership is active.</li>
        <li>You may not share your account, download videos without permission, or redistribute course materials.</li>
        <li>Courses are educational. We don’t guarantee any income, job or business result.</li>
      </ul>

      <h2>3. Payments</h2>
      <ul>
        <li>Prices are shown in Indian rupees unless stated otherwise. Applicable taxes are shown at checkout.</li>
        <li>Payments are processed by our payment provider. We don’t store full card details.</li>
        <li>
          Refunds follow our <Link href="/legal/refunds">refund and cancellation policy</Link>.
        </li>
      </ul>

      <h2>4. Instructors</h2>
      <p>
        Instructors keep ownership of their content and grant us a licence to host, market and sell it on the platform.
        Instructors must have the rights to everything they upload. Revenue shares are agreed before publishing and
        recorded with each sale. Separate instructor terms apply.
      </p>

      <h2>5. Affiliates</h2>
      <p>
        Affiliates earn commission only on eligible referred purchases, under the affiliate terms shown when applying.
        Self-referrals, misleading claims and spam are not allowed and may result in forfeited commissions.
      </p>

      <h2>6. Acceptable use</h2>
      <p>
        Don’t misuse the platform: no unlawful content, harassment, attempts to bypass access controls, or automated
        scraping.
      </p>

      <h2>7. Liability</h2>
      <p>
        To the extent permitted by law, our total liability for any claim is limited to the amount you paid us in the 12
        months before the claim.
      </p>

      <h2>8. Governing law and grievances</h2>
      <p>
        These terms are governed by the laws of India. Courts at <Placeholder value="" label="city" /> have
        jurisdiction. For complaints, contact our grievance officer at{" "}
        <Placeholder value={brand.grievanceOfficerEmail} label="grievance officer email" />.
      </p>

      <h2>9. Changes</h2>
      <p>We’ll notify registered users of material changes before they take effect.</p>
    </LegalPage>
  );
}
