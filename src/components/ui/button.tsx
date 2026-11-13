import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover",
        ink: "bg-ink text-white hover:bg-ink-2",
        secondary: "border border-line-strong bg-surface text-text hover:border-ink-3 hover:bg-paper",
        ghost: "text-text hover:bg-primary-soft hover:text-primary-ink",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
        danger: "bg-danger text-white hover:bg-danger/90",
        inverse: "bg-white text-ink hover:bg-paper",
        "inverse-outline": "border border-white/30 text-white hover:border-white hover:bg-white/5",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-md px-5 text-[15px]",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "size-10 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
