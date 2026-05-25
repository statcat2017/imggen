import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

type ButtonProps = {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-ctp-mauve text-ctp-crust hover:brightness-110 active:brightness-90",
  secondary: "border border-ctp-surface1 text-ctp-text hover:bg-ctp-surface0/50",
  ghost: "text-ctp-subtext0 hover:text-ctp-text",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function Button({ variant, size, disabled = false, children, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg inline-flex items-center justify-center gap-2 transition-colors font-medium
        focus-visible:ring-2 focus-visible:ring-ctp-mauve/50 focus-visible:ring-offset-1 focus-visible:ring-offset-ctp-crust
        ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
        ${variantStyles[variant]}
        ${sizeStyles[size]}`}
    >
      {children}
    </button>
  );
}
