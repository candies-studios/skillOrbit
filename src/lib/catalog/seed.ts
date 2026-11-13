/**
 * ─────────────────────────────────────────────────────────────────────────
 *  DEVELOPMENT SEED DATA — NOT REAL COURSES, INSTRUCTORS OR PRICES.
 * ─────────────────────────────────────────────────────────────────────────
 * Used only until Phase 2/3 connects the catalog to Supabase. Every record
 * has isSample: true and the UI labels it as a sample. Instructor names are
 * fictional. No ratings, enrolment counts or testimonials are seeded,
 * because those must come from real records.
 *
 * Categories are the real launch categories from the product brief.
 */
import type { Category, Course, CourseModule, Instructor, Lesson, LessonType, MembershipPlan } from "./types";

export const categories: Category[] = [
  {
    id: "cat-ai",
    slug: "ai",
    name: "AI and Artificial Intelligence",
    shortName: "AI",
    description:
      "Use AI tools in real work: prompting, automation, research and building simple AI-assisted workflows.",
    hue: 248,
    sortOrder: 1,
  },
  {
    id: "cat-dm",
    slug: "digital-marketing",
    name: "Digital Marketing",
    shortName: "Marketing",
    description: "Search, social, email and paid ads — plan campaigns, measure them and improve what works.",
    hue: 205,
    sortOrder: 2,
  },
  {
    id: "cat-fl",
    slug: "freelancing",
    name: "Freelancing and Digital Services",
    shortName: "Freelancing",
    description: "Package a skill into a service, find clients, price your work and deliver it professionally.",
    hue: 168,
    sortOrder: 3,
  },
  {
    id: "cat-ob",
    slug: "online-business",
    name: "Online Business and E-commerce",
    shortName: "E-commerce",
    description: "Launch and run an online store or digital product business, from sourcing to payments to fulfilment.",
    hue: 32,
    sortOrder: 4,
  },
  {
    id: "cat-cc",
    slug: "content-creation",
    name: "Content Creation",
    shortName: "Content",
    description: "Write, film and edit content people want to follow, and build a repeatable publishing system.",
    hue: 330,
    sortOrder: 5,
  },
  {
    id: "cat-bf",
    slug: "business-finance",
    name: "Business and Finance Skills",
    shortName: "Business",
    description: "Bookkeeping, pricing, GST basics, spreadsheets and the numbers every small business needs.",
    hue: 280,
    sortOrder: 6,
  },
];

export const instructors: Instructor[] = [
  {
    id: "ins-1",
    slug: "meera-iyer",
    displayName: "Meera Iyer",
    headline: "Applied AI and workflow automation",
    bio: "Sample profile. Meera is a fictional instructor used to preview how instructor pages look. Real instructor profiles will come from approved instructor applications.",
    expertise: ["Prompting", "Automation", "AI research tools"],
    location: "Bengaluru, India",
    isFeatured: true,
    isSample: true,
  },
  {
    id: "ins-2",
    slug: "daniel-okafor",
    displayName: "Daniel Okafor",
    headline: "Performance marketing and analytics",
    bio: "Sample profile. Daniel is a fictional instructor used to preview how instructor pages look. Real instructor profiles will come from approved instructor applications.",
    expertise: ["Paid ads", "Analytics", "SEO"],
    location: "Lagos, Nigeria",
    isFeatured: true,
    isSample: true,
  },
  {
    id: "ins-3",
    slug: "ananya-rao",
    displayName: "Ananya Rao",
    headline: "Freelance business and client services",
    bio: "Sample profile. Ananya is a fictional instructor used to preview how instructor pages look. Real instructor profiles will come from approved instructor applications.",
    expertise: ["Freelancing", "Proposals", "Pricing"],
    location: "Pune, India",
    isFeatured: true,
    isSample: true,
  },
  {
    id: "ins-4",
    slug: "sofia-marin",
    displayName: "Sofia Marín",
    headline: "Content strategy and short-form video",
    bio: "Sample profile. Sofia is a fictional instructor used to preview how instructor pages look. Real instructor profiles will come from approved instructor applications.",
    expertise: ["Video editing", "Storytelling", "Content systems"],
    location: "Valencia, Spain",
    isFeatured: false,
    isSample: true,
  },
];

// Compact builder for seed curricula: [title, [[lessonTitle, type, minutes, preview?], ...]]
type LessonTuple = [string, LessonType, number, boolean?];
function curriculum(courseKey: string, mods: [string, LessonTuple[]][]): CourseModule[] {
  return mods.map(([title, lessons], mi) => ({
    id: `${courseKey}-m${mi + 1}`,
    title,
    lessons: lessons.map(([lt, type, durationMinutes, isPreview], li): Lesson => ({
      id: `${courseKey}-m${mi + 1}-l${li + 1}`,
      title: lt,
      type,
      durationMinutes,
      isPreview: Boolean(isPreview),
    })),
  }));
}

const base = {
  language: "English",
  currency: "INR" as const,
  status: "published" as const,
  isSample: true,
};

export const courses: Course[] = [
  {
    ...base,
    id: "crs-1",
    slug: "ai-for-everyday-work",
    title: "AI for Everyday Work",
    subtitle: "Use AI assistants to research, write and plan faster — without losing accuracy.",
    description:
      "A practical introduction to working with AI assistants. You will learn how to write clear instructions, check outputs for errors, and build small repeatable workflows for research, writing and planning.",
    categorySlug: "ai",
    instructorSlug: "meera-iyer",
    level: "beginner",
    priceMinor: 149900,
    compareAtPriceMinor: 249900,
    includedInMembership: true,
    isFeatured: true,
    publishedAt: "2026-09-02",
    updatedAt: "2026-10-28",
    outcomes: [
      "Write prompts that produce usable first drafts",
      "Verify AI output against sources before you rely on it",
      "Build three reusable workflows for your own job",
      "Know what not to share with AI tools",
    ],
    requirements: ["A laptop or phone with a browser", "No technical background needed"],
    audience: ["Working professionals", "Students", "Small business owners"],
    modules: curriculum("crs-1", [
      [
        "Getting started",
        [
          ["What AI assistants are good and bad at", "video", 9, true],
          ["Setting up your tools", "video", 7, true],
          ["Privacy basics", "reading", 6],
        ],
      ],
      [
        "Writing instructions that work",
        [
          ["Context, task, format", "video", 14],
          ["Iterating on a draft", "video", 12],
          ["Practice: rewrite five prompts", "assignment", 20],
        ],
      ],
      [
        "Checking the output",
        [
          ["Spotting confident mistakes", "video", 11],
          ["Source-checking routine", "reading", 8],
          ["Module quiz", "quiz", 10],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-2",
    slug: "no-code-ai-automation",
    title: "No-Code AI Automation",
    subtitle: "Connect AI to the apps you already use and automate repetitive tasks.",
    description:
      "Design small automations that move information between forms, sheets, email and AI models. Focuses on reliable, auditable automations rather than flashy demos.",
    categorySlug: "ai",
    instructorSlug: "meera-iyer",
    level: "intermediate",
    priceMinor: 299900,
    compareAtPriceMinor: null,
    includedInMembership: true,
    isFeatured: false,
    publishedAt: "2026-10-10",
    updatedAt: "2026-10-30",
    outcomes: [
      "Map a manual process before automating it",
      "Build automations with error handling",
      "Keep humans in the loop for important decisions",
    ],
    requirements: ["Comfort with spreadsheets", "Completed an intro AI course or equivalent"],
    audience: ["Operations staff", "Freelancers", "Founders"],
    modules: curriculum("crs-2", [
      [
        "Automation thinking",
        [
          ["Which tasks to automate", "video", 10, true],
          ["Process mapping", "assignment", 25],
        ],
      ],
      [
        "Building the flow",
        [
          ["Triggers and actions", "video", 16],
          ["Adding an AI step", "video", 18],
          ["Handling failures", "video", 13],
        ],
      ],
      [
        "Wrap-up",
        [
          ["Final project brief", "reading", 8],
          ["Quiz", "quiz", 10],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-3",
    slug: "digital-marketing-foundations",
    title: "Digital Marketing Foundations",
    subtitle: "Plan, launch and measure your first multi-channel campaign.",
    description:
      "Learn how search, social, email and paid ads fit together. You will plan a small campaign end to end and learn how to read the numbers honestly.",
    categorySlug: "digital-marketing",
    instructorSlug: "daniel-okafor",
    level: "beginner",
    priceMinor: 199900,
    compareAtPriceMinor: 299900,
    includedInMembership: true,
    isFeatured: true,
    publishedAt: "2026-08-20",
    updatedAt: "2026-10-12",
    outcomes: [
      "Define an audience and a measurable goal",
      "Choose channels that fit your budget",
      "Set up basic tracking",
      "Report results without vanity metrics",
    ],
    requirements: ["None"],
    audience: ["Beginners", "Small business owners", "Career switchers"],
    modules: curriculum("crs-3", [
      [
        "Marketing basics",
        [
          ["The customer journey", "video", 12, true],
          ["Goals you can measure", "video", 9],
        ],
      ],
      [
        "Channels",
        [
          ["Search and SEO", "video", 15],
          ["Social media", "video", 14],
          ["Email", "video", 11],
          ["Paid ads", "video", 17],
        ],
      ],
      [
        "Measurement",
        [
          ["Tracking setup", "video", 13],
          ["Campaign plan", "assignment", 30],
          ["Quiz", "quiz", 10],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-4",
    slug: "seo-that-lasts",
    title: "SEO That Lasts",
    subtitle: "Earn search traffic with useful content and sound technical basics.",
    description:
      "A grounded approach to search engine optimisation: keyword research, content that answers real questions, and technical hygiene.",
    categorySlug: "digital-marketing",
    instructorSlug: "daniel-okafor",
    level: "intermediate",
    priceMinor: 249900,
    compareAtPriceMinor: null,
    includedInMembership: true,
    isFeatured: false,
    publishedAt: "2026-10-01",
    updatedAt: "2026-10-01",
    outcomes: ["Research keywords with intent", "Structure pages for search", "Audit a site"],
    requirements: ["A website you can edit, or a practice site"],
    audience: ["Marketers", "Bloggers", "Store owners"],
    modules: curriculum("crs-4", [
      [
        "Search intent",
        [
          ["How search works today", "video", 12, true],
          ["Intent mapping", "assignment", 20],
        ],
      ],
      [
        "On-page",
        [
          ["Titles and structure", "video", 14],
          ["Internal links", "video", 9],
        ],
      ],
      [
        "Technical",
        [
          ["Site audit walkthrough", "video", 22],
          ["Quiz", "quiz", 10],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-5",
    slug: "start-freelancing",
    title: "Start Freelancing",
    subtitle: "Turn one skill into a service clients will pay for.",
    description:
      "Package what you already know into a clear offer, write proposals, set prices and handle clients professionally — including contracts and invoicing basics for India and abroad.",
    categorySlug: "freelancing",
    instructorSlug: "ananya-rao",
    level: "beginner",
    priceMinor: 0,
    compareAtPriceMinor: null,
    includedInMembership: true,
    isFeatured: true,
    publishedAt: "2026-07-15",
    updatedAt: "2026-10-05",
    outcomes: [
      "Define a focused service offer",
      "Write a proposal that answers the client's problem",
      "Price by value, not by hour alone",
    ],
    requirements: ["One skill you can offer"],
    audience: ["Students", "Professionals starting a side income"],
    modules: curriculum("crs-5", [
      [
        "Your offer",
        [
          ["Picking a niche", "video", 11, true],
          ["Writing your offer", "assignment", 20, true],
        ],
      ],
      [
        "Getting clients",
        [
          ["Where clients look", "video", 13],
          ["Proposals", "video", 15],
        ],
      ],
      [
        "Working professionally",
        [
          ["Contracts and invoices", "reading", 12],
          ["Quiz", "quiz", 8],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-6",
    slug: "launch-an-online-store",
    title: "Launch an Online Store",
    subtitle: "From product idea to first order, with payments and shipping sorted.",
    description:
      "Choose a platform, set up products, take payments and organise fulfilment. Covers the practical steps for selling in India and the extra steps for selling abroad.",
    categorySlug: "online-business",
    instructorSlug: "ananya-rao",
    level: "beginner",
    priceMinor: 249900,
    compareAtPriceMinor: 349900,
    includedInMembership: false,
    isFeatured: true,
    publishedAt: "2026-09-18",
    updatedAt: "2026-10-22",
    outcomes: ["Validate a product idea", "Set up a store", "Plan shipping and returns"],
    requirements: ["A product idea"],
    audience: ["Aspiring founders", "Makers", "Resellers"],
    modules: curriculum("crs-6", [
      [
        "Validate",
        [
          ["Is there demand?", "video", 12, true],
          ["Competitor review", "assignment", 25],
        ],
      ],
      [
        "Build",
        [
          ["Choosing a platform", "video", 10],
          ["Product pages", "video", 16],
          ["Payments", "video", 14],
        ],
      ],
      [
        "Operate",
        [
          ["Shipping and returns", "video", 15],
          ["Quiz", "quiz", 10],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-7",
    slug: "short-form-video-system",
    title: "A Short-Form Video System",
    subtitle: "Plan, film and edit a week of videos in one sitting.",
    description:
      "Build a repeatable content system: idea bank, scripting templates, batch filming and simple editing on a phone.",
    categorySlug: "content-creation",
    instructorSlug: "sofia-marin",
    level: "beginner",
    priceMinor: 129900,
    compareAtPriceMinor: null,
    includedInMembership: true,
    isFeatured: true,
    publishedAt: "2026-10-20",
    updatedAt: "2026-11-02",
    outcomes: ["Keep an idea bank", "Script hooks quickly", "Batch-film and edit on a phone"],
    requirements: ["A smartphone"],
    audience: ["Creators", "Small brands", "Educators"],
    modules: curriculum("crs-7", [
      [
        "Ideas",
        [
          ["The idea bank", "video", 9, true],
          ["Hooks that hold attention", "video", 12],
        ],
      ],
      [
        "Production",
        [
          ["Batch filming", "video", 14],
          ["Phone editing", "video", 18],
        ],
      ],
      [
        "Publishing",
        [
          ["Weekly rhythm", "reading", 7],
          ["Quiz", "quiz", 8],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-8",
    slug: "numbers-for-small-business",
    title: "Numbers for Small Business",
    subtitle: "Bookkeeping, pricing and cash flow in plain language.",
    description:
      "The financial basics every freelancer and small business needs: tracking income and expenses, understanding margins, cash-flow planning and an introduction to GST.",
    categorySlug: "business-finance",
    instructorSlug: "ananya-rao",
    level: "beginner",
    priceMinor: 179900,
    compareAtPriceMinor: null,
    includedInMembership: true,
    isFeatured: true,
    publishedAt: "2026-09-30",
    updatedAt: "2026-10-18",
    outcomes: ["Keep simple books", "Price with margin", "Forecast cash flow"],
    requirements: ["Basic spreadsheet use"],
    audience: ["Freelancers", "Shop owners", "Founders"],
    modules: curriculum("crs-8", [
      [
        "Foundations",
        [
          ["Income vs profit", "video", 10, true],
          ["Simple bookkeeping", "video", 15],
        ],
      ],
      [
        "Pricing",
        [
          ["Costs and margin", "video", 13],
          ["Pricing worksheet", "assignment", 20],
        ],
      ],
      [
        "Cash flow",
        [
          ["Forecasting", "video", 14],
          ["GST overview", "reading", 12],
          ["Quiz", "quiz", 10],
        ],
      ],
    ]),
  },
  {
    ...base,
    id: "crs-9",
    slug: "advanced-paid-ads",
    title: "Advanced Paid Ads",
    subtitle: "Structure, test and scale ad campaigns with disciplined measurement.",
    description:
      "For marketers already running ads. Campaign structure, creative testing, attribution caveats and budget scaling rules.",
    categorySlug: "digital-marketing",
    instructorSlug: "daniel-okafor",
    level: "advanced",
    priceMinor: 399900,
    compareAtPriceMinor: null,
    includedInMembership: false,
    isFeatured: false,
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    outcomes: ["Design creative tests", "Read attribution critically", "Scale budgets safely"],
    requirements: ["Experience running paid campaigns"],
    audience: ["Performance marketers", "Agency staff"],
    modules: curriculum("crs-9", [
      [
        "Structure",
        [
          ["Account structure", "video", 16, true],
          ["Audiences", "video", 14],
        ],
      ],
      [
        "Testing",
        [
          ["Creative testing design", "video", 18],
          ["Test plan", "assignment", 30],
        ],
      ],
      [
        "Scaling",
        [
          ["Budget rules", "video", 12],
          ["Quiz", "quiz", 12],
        ],
      ],
    ]),
  },
];

/** Placeholder plan pricing — configure real prices in admin (Phase 6). */
export const membershipPlans: MembershipPlan[] = [
  {
    id: "plan-monthly",
    code: "all_access_monthly",
    name: "All-access monthly",
    interval: "month",
    priceMinor: 79900,
    currency: "INR",
    description: "Every membership-eligible course, billed monthly. Cancel any time.",
    benefits: [
      "All membership-eligible courses",
      "New courses as they are added",
      "Certificates of completion",
      "Downloadable resources",
    ],
    isHighlighted: false,
    isSample: true,
  },
  {
    id: "plan-annual",
    code: "all_access_annual",
    name: "All-access annual",
    interval: "year",
    priceMinor: 699900,
    currency: "INR",
    description: "The same access, billed once a year at a lower effective monthly price.",
    benefits: [
      "Everything in monthly",
      "Lower effective monthly price",
      "Certificates of completion",
      "Downloadable resources",
    ],
    isHighlighted: true,
    isSample: true,
  },
];
