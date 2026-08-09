import { cn } from "@/lib/utils";

/** Brand mark: courier on scooter (navy palette). */
const LOGO_SRC = "/goswift-logo.svg";

interface AppLogoProps {
  className?: string;
  /** Decorative usages (next to a visible wordmark) should pass false. */
  labelled?: boolean;
}

/** The GOSwift brand mark — delivery courier on scooter. */
export function AppLogo({ className, labelled = true }: AppLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={labelled ? "GOSwift" : ""}
      aria-hidden={labelled ? undefined : true}
      width={256}
      height={256}
      className={cn(
        "block aspect-square h-auto w-auto max-h-full max-w-full shrink-0 select-none object-contain object-center",
        className,
      )}
      draggable={false}
    />
  );
}
