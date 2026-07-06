"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to prevent accidental navigation when a form is dirty.
 * Handles both browser refresh/close (beforeunload) and Next.js client-side routing.
 */
export function useUnsavedChanges(isDirty: boolean, message = "You have unsaved changes. Are you sure you want to leave?") {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, message]);

  // Next.js doesn't natively support intercepting client-side navigation in App Router easily yet.
  // We can attach a listener to window pushState/replaceState as a polyfill.
  useEffect(() => {
    if (!isDirty) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && anchor.href && anchor.target !== "_blank") {
        const url = new URL(anchor.href);
        // Only trigger on internal links
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          if (!window.confirm(message)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, [isDirty, message]);
}
