import { cn } from "@/lib/utils";

/** Served from /public so favicons and in-app mark stay in sync. */
const LOGO_SRC = "/goswift-logo.png";

interface AppLogoProps {
  className?: string;
  /** Decorative usages (next to a visible wordmark) should pass false. */
  labelled?: boolean;
}

/** The GOSwift brand mark — orange delivery van with parcel. */
export function AppLogo({ className, labelled = true }: AppLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={labelled ? "GOSwift" : ""}
      aria-hidden={labelled ? undefined : true}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}
