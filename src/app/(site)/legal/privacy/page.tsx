import type { Metadata } from "next";
import { LegalPage, Placeholder } from "@/components/marketing/legal-page";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="14 November 2026">
      <p>
        This policy explains what personal data {brand.name} collects, why, and the choices you have. It is intended to
        align with India’s Digital Personal Data Protection Act, 2023 and, for users elsewhere, applicable local law.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, password (stored hashed by our authentication provider).
        </li>
        <li>
          <strong>Learning data:</strong> enrolments, lesson progress, quiz attempts, notes and certificates.
        </li>
        <li>
          <strong>Purchase data:</strong> orders, amounts and payment status. Card and UPI details are handled by our
          payment provider, not stored by us.
        </li>
        <li>
          <strong>Instructor and affiliate data:</strong> application details and the payout details needed to pay you.
        </li>
        <li>
          <strong>Referral data:</strong> when you arrive through an affiliate link, we record the referral code and a
          timestamp to attribute purchases.
        </li>
        <li>
          <strong>Technical data:</strong> basic logs needed for security and fraud prevention.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run your account and give you access to what you’ve bought.</li>
        <li>To process payments, refunds, instructor earnings and affiliate commissions.</li>
        <li>To send transactional emails such as purchase confirmations and password resets.</li>
        <li>To keep the platform secure and meet legal and tax obligations.</li>
      </ul>
      <p>We don’t sell your personal data.</p>

      <h2>Service providers</h2>
      <p>
        We use service providers to host data, authenticate users, process payments, deliver video and send email. They
        process data on our instructions. A current list will be published here before launch.
      </p>

      <h2>Retention</h2>
      <p>
        We keep account data while your account is active. Financial records are kept for the period required by tax
        law. You can ask us to delete your account; some records may be retained where the law requires.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or erase your personal data, withdraw consent, and nominate someone to exercise
        your rights. Contact <Placeholder value={brand.grievanceOfficerEmail} label="grievance officer email" />.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies for sign-in and security, and a referral cookie to attribute affiliate sales. We’ll ask
        before using any non-essential analytics cookies.
      </p>

      <h2>Contact</h2>
      <p>
        Data fiduciary: <Placeholder value={brand.legalName} label="legal entity name" />,{" "}
        <Placeholder value={brand.postalAddress} label="registered address" />.
      </p>
    </LegalPage>
  );
}
