import Link from "next/link";
import { footerNav } from "@/config/navigation";
import { brand } from "@/config/brand";
import { Container, Logo } from "./primitives";

export function SiteFooter() {
  const contactConfigured = Boolean(brand.supportEmail);
  return (
    <footer className="bg-ink text-white/70">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <Logo inverse />
          <p className="mt-4 text-[15px] leading-relaxed">{brand.tagline}</p>
          <div className="mt-6 space-y-1 text-sm">
            {contactConfigured ? (
              <p>
                Support:{" "}
                <a className="text-white underline-offset-4 hover:underline" href={`mailto:${brand.supportEmail}`}>
                  {brand.supportEmail}
                </a>
              </p>
            ) : (
              <p className="text-white/50">Support contact not configured yet.</p>
            )}
            {brand.postalAddress && <p>{brand.postalAddress}</p>}
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-white">{group.title}</h2>
              <ul className="mt-4 space-y-2.5 text-[15px]">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-sm text-white/50 sm:flex-row sm:justify-between">
          <p>© 2026 {brand.legalName || brand.name}. All rights reserved.</p>
          <p>Prices shown in INR unless stated otherwise.</p>
        </Container>
      </div>
    </footer>
  );
}
