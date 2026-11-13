/**
 * FAQ copy. Answers describe how the platform is designed to work.
 * Review them before launch so they match final policy and pricing.
 */
export type FaqGroup = { id: string; title: string; items: { q: string; a: string }[] };

export const faqGroups: FaqGroup[] = [
  {
    id: "learning",
    title: "Learning",
    items: [
      {
        q: "How long do I keep access to a course I buy?",
        a: "A course bought individually stays in your account for as long as the course is offered on the platform, including future updates to that course.",
      },
      {
        q: "Can I watch lessons before buying?",
        a: "Yes. Most courses have free preview lessons, and the full curriculum is visible on every course page.",
      },
      {
        q: "Do I get a certificate?",
        a: "When you complete every required lesson and assessment in a course, you can download a certificate with a unique ID that anyone can verify on our site.",
      },
      {
        q: "Can I learn on my phone?",
        a: "Yes. The site works on phones, tablets and computers, and your progress is saved to your account.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments and membership",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "We are integrating Razorpay for payments in India, which supports UPI, cards, net banking and wallets. International payment options will be announced when they are available.",
      },
      {
        q: "What's the difference between buying a course and membership?",
        a: "Buying a course gives you that course. Membership gives you access to every membership-eligible course while your membership is active. Some courses are sold individually only; course pages say which.",
      },
      {
        q: "Can I cancel my membership?",
        a: "Yes. You keep access until the end of the period you've paid for, and you won't be charged again.",
      },
      {
        q: "What is your refund policy?",
        a: "See the refund and cancellation policy for the exact terms, including the time window and how refunds are processed.",
      },
    ],
  },
  {
    id: "teaching",
    title: "Teaching and affiliates",
    items: [
      {
        q: "How do I become an instructor?",
        a: "Create an account and submit an instructor application. Our team reviews applications, and approved instructors can create course drafts and submit them for review.",
      },
      {
        q: "How are instructors paid?",
        a: "Instructors earn an agreed share of each sale of their course, recorded in an earnings ledger. Payouts are reviewed and processed manually in the first release.",
      },
      {
        q: "Can I be a student, instructor and affiliate at the same time?",
        a: "Yes. One account can hold all three roles, and each has its own dashboard.",
      },
      {
        q: "How do affiliate commissions work?",
        a: "Approved affiliates get referral links. When a referred visitor buys within the attribution window, a commission is recorded as pending, becomes payable after the holding period, and is reversed if the order is refunded.",
      },
    ],
  },
];
