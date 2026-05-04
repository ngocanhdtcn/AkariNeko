"use client";

import { useEffect } from "react";

let activeScrollLocks = 0;

type ScrollLockSnapshot = {
  bodyOverflow: string;
  bodyPaddingRight: string;
  documentOverscrollBehavior: string;
  visualViewportHeight: string;
  appScrollElement: HTMLElement | null;
  appOverflow?: string;
};

let scrollLockSnapshot: ScrollLockSnapshot | null = null;

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    if (activeScrollLocks === 0) {
      const appScrollElement = document.querySelector<HTMLElement>(
        ".akari-mobile-scroll",
      );

      scrollLockSnapshot = {
        bodyOverflow: document.body.style.overflow,
        bodyPaddingRight: document.body.style.paddingRight,
        documentOverscrollBehavior:
          document.documentElement.style.overscrollBehavior,
        visualViewportHeight: document.documentElement.style.getPropertyValue(
          "--akari-visual-viewport-height",
        ),
        appScrollElement,
        appOverflow: appScrollElement?.style.overflow,
      };
    }

    activeScrollLocks += 1;

    const appScrollElement = scrollLockSnapshot?.appScrollElement;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    function updateVisualViewportHeight() {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--akari-visual-viewport-height",
        `${viewportHeight}px`,
      );
    }

    updateVisualViewportHeight();
    document.body.style.overflow = "hidden";
    document.body.classList.add("akari-scroll-locked");
    document.documentElement.style.overscrollBehavior = "none";
    window.visualViewport?.addEventListener("resize", updateVisualViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateVisualViewportHeight);

    if (appScrollElement) {
      appScrollElement.style.overflow = "hidden";
    }

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      activeScrollLocks = Math.max(0, activeScrollLocks - 1);

      window.visualViewport?.removeEventListener(
        "resize",
        updateVisualViewportHeight,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updateVisualViewportHeight,
      );

      if (activeScrollLocks > 0) {
        return;
      }

      document.body.style.overflow = scrollLockSnapshot?.bodyOverflow ?? "";
      document.body.style.paddingRight =
        scrollLockSnapshot?.bodyPaddingRight ?? "";
      document.body.classList.remove("akari-scroll-locked");
      document.documentElement.style.overscrollBehavior =
        scrollLockSnapshot?.documentOverscrollBehavior ?? "";
      document.documentElement.style.setProperty(
        "--akari-visual-viewport-height",
        scrollLockSnapshot?.visualViewportHeight ?? "",
      );

      if (scrollLockSnapshot?.appScrollElement) {
        scrollLockSnapshot.appScrollElement.style.overflow =
          scrollLockSnapshot.appOverflow ?? "";
      }

      scrollLockSnapshot = null;
    };
  }, [isLocked]);
}
