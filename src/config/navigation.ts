export type NavLink = { href: string; label: string };

export const primaryNav: NavLink[] = [
  { href: "/courses", label: "Courses" },
  { href: "/categories", label: "Categories" },
  { href: "/instructors", label: "Instructors" },
  { href: "/pricing", label: "Membership" },
  { href: "/affiliates", label: "Affiliates" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/categories", label: "Categories" },
      { href: "/pricing", label: "Membership" },
      { href: "/instructors", label: "Instructors" },
    ],
  },
  {
    title: "Earn",
    links: [
      { href: "/teach", label: "Teach on SkillOrbit" },
      { href: "/affiliates", label: "Affiliate programme" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/legal/terms", label: "Terms and conditions" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/refunds", label: "Refund and cancellation" },
    ],
  },
];
