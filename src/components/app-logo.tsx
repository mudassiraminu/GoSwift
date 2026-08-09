import { cn } from "@/lib/utils";
import { GOSWIFT_LOGO_DATA_URL } from "@/lib/brand/logo-data";

interface AppLogoProps {
  className?: string;
  /** Decorative usages (next to a visible wordmark) should pass false. */
  labelled?: boolean;
}

/** GOSwift brand mark — full scooter icon, never cropped. */
export function AppLogo({ className, labelled = true }: AppLogoProps) {
  return (
    <img
      src={GOSWIFT_LOGO_DATA_URL}
      alt={labelled ? "GOSwift" : ""}
      aria-hidden={labelled ? undefined : true}
      width={128}
      height={128}
      className={cn(
        "block aspect-square h-auto w-auto max-h-full max-w-full shrink-0 select-none object-contain object-center",
        className,
      )}
      draggable={false}
    />
  );
}
