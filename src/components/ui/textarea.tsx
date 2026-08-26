import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[140px] w-full rounded-2xl border-2 border-white/15 bg-background/70 px-4 py-3 text-[1rem] font-medium leading-relaxed text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all placeholder:text-muted-foreground/80 placeholder:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent/60 focus:shadow-[0_0_0_4px_rgba(var(--accent),0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
