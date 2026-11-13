import "server-only";

/**
 * Integration status, derived from environment variables. Used to show an
 * honest "not configured" state instead of pretending an integration works.
 * Only presence is checked here — values are never logged or returned.
 */
export function integrationStatus() {
  return {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  };
}
