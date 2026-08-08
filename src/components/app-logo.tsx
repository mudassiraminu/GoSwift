import { cn } from "@/lib/utils";

/** Brand mark: orange delivery van (matches app peach palette). */
const LOGO_SRC = "/goswift-logo.svg";

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
