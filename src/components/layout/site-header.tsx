import { primaryNav } from "@/config/navigation";
import { Container, Logo } from "./primitives";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
      <Container className="flex h-16 items-center gap-8">
        <Logo />
        <nav aria-label="Primary" className="hidden lg:block">
          <NavLinks links={primaryNav} />
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <UserMenu />
        </div>
        <div className="ml-auto lg:hidden">
          <MobileNav links={primaryNav} />
        </div>
      </Container>
    </header>
  );
}
