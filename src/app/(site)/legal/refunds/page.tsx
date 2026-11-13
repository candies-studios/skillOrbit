import type { Metadata } from "next";
import { LegalPage, Placeholder } from "@/components/marketing/legal-page";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Refund and cancellation policy" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund and cancellation policy" updated="14 November 2026">
      <p>
        We want you to buy with confidence. This policy explains when you can get a refund and how cancellations work.
        The values marked for configuration are set by the platform admin before launch.
      </p>

      <h2>Individual course purchases</h2>
      <ul>
        <li>
          You can request a full refund within <Placeholder value="" label="number of days" /> days of purchase, if you
          have completed less than <Placeholder value="" label="percentage" />% of the course.
        </li>
        <li>Refunds aren’t available after a certificate has been issued for the course.</li>
        <li>When a refund is approved, your access to that course ends.</li>
      </ul>

      <h2>Membership</h2>
      <ul>
        <li>
          You can cancel at any time from your account. You keep access until the end of the current billing period.
        </li>
        <li>
          We don’t refund partial billing periods, except where required by law or where we’ve made a billing error.
        </li>
        <li>If a renewal payment fails, we retry during a short grace period before access is paused.</li>
      </ul>

      <h2>How refunds are paid</h2>
      <p>
        Approved refunds go back to the original payment method. Once processed by us, banks typically take 5–7 working
        days to show the credit.
      </p>

      <h2>Effect on instructors and affiliates</h2>
      <p>
        When an order is refunded or charged back, the related instructor earnings and affiliate commissions are
        reversed in their ledgers.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Use the contact form with your order ID, or email{" "}
        <Placeholder value={brand.supportEmail} label="support email" />. We aim to respond within 2 working days.
      </p>
    </LegalPage>
  );
}
