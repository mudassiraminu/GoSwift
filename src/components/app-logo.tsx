import logoAsset from "@/assets/goswift-logo.png.asset.json";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  /** Decorative usages (next to a visible wordmark) should pass false. */
  labelled?: boolean;
}

/** The GOSwift brand mark. Single source of truth for the app icon artwork. */
export function AppLogo({ className, labelled = true }: AppLogoProps) {
  return (
    <img
      src={logoAsset.url}
      alt={labelled ? "GOSwift" : ""}
      aria-hidden={labelled ? undefined : true}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}
