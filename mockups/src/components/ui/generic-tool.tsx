"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SHIMMER_STYLE_ID = "an-generic-tool-shimmer-styles";
const SHIMMER_STYLES = `
@keyframes an-generic-shimmer {
  from { background-position: 100% center; }
  to { background-position: 0% center; }
}
.an-generic-shimmer {
  display: inline-flex;
  align-items: center;
  height: 1rem;
  background-size: 250% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(90deg, #a3a3a3 0%, #a3a3a3 40%, #525252 50%, #a3a3a3 60%, #a3a3a3 100%);
  background-repeat: no-repeat;
  animation: an-generic-shimmer 1.2s linear infinite;
}
`;

let shimmerStylesInjected = false;
function ensureShimmerStyles() {
  if (typeof document === "undefined") return;
  if (shimmerStylesInjected) return;
  if (document.getElementById(SHIMMER_STYLE_ID)) {
    shimmerStylesInjected = true;
    return;
  }
  const el = document.createElement("style");
  el.id = SHIMMER_STYLE_ID;
  el.textContent = SHIMMER_STYLES;
  document.head.appendChild(el);
  shimmerStylesInjected = true;
}

export type GenericToolProps = {
  /** Optional left-aligned icon component (passes className). */
  icon?: React.ComponentType<{ className?: string }>;
  /** Main label. Becomes the shimmering "Doing X..." when isPending. */
  title: string;
  /** Optional muted detail text rendered after the label. */
  subtitle?: string;
  /** When true, the title shimmers; otherwise it renders static. */
  isPending?: boolean;
  className?: string;
};

export const GenericTool = React.memo(function GenericTool({
  icon: Icon,
  title,
  subtitle,
  isPending = false,
  className,
}: GenericToolProps) {
  React.useEffect(() => {
    ensureShimmerStyles();
  }, []);

  return (
    <div
      className={cn(
        "flex items-center max-w-full select-none gap-1",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0 text-sm text-neutral-500 dark:text-neutral-400">
        {Icon && (
          <span className="flex items-center justify-center size-3 shrink-0">
            <Icon className="w-full h-full shrink-0 text-neutral-500 dark:text-neutral-400" />
          </span>
        )}
        <span className="font-[450] whitespace-nowrap shrink-0">
          {isPending ? (
            <span className="an-generic-shimmer">{title}</span>
          ) : (
            title
          )}
        </span>
        {subtitle && (
          <span className="font-normal truncate min-w-0 flex-1 text-neutral-400 dark:text-neutral-500/80">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
});
