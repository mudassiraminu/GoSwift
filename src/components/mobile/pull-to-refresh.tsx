import { Loader2, ArrowDown } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const THRESHOLD = 72;
const MAX_PULL = 120;

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  className?: string;
}

/**
 * Native-feeling pull-to-refresh for touch devices (iOS + Android).
 * Falls back gracefully on desktop where there is no touch input.
 */
export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
    },
    [refreshing],
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // Rubber-band resistance
    setPull(Math.min(MAX_PULL, delta * 0.5));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [onRefresh, pull]);

  const active = pull >= THRESHOLD;

  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{ height: pull, opacity: pull > 4 ? 1 : 0, transition: "opacity 150ms ease" }}
      >
        <div
          className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary shadow-lg shadow-primary/15"
          style={{
            transform: `translateY(${Math.max(0, pull - 48)}px) rotate(${pull * 3}deg)`,
            transition: refreshing ? "transform 200ms ease" : "none",
          }}
        >
          {refreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown className={cn("h-5 w-5 transition-colors", active && "text-accent")} />
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => void onTouchEnd()}
        className="no-scrollbar h-full overflow-y-auto overscroll-contain"
        style={{
          transform: `translateY(${pull}px)`,
          transition: startY.current === null ? "transform 320ms cubic-bezier(0.2,0.8,0.3,1)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
