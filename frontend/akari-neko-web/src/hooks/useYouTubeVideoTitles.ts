"use client";

import { useEffect, useMemo, useState } from "react";
import { isYouTubeUrl } from "@/lib/youtube";

export function useYouTubeVideoTitles(urls: string[]) {
  const youtubeUrls = useMemo(
    () => Array.from(new Set(urls.filter((url) => isYouTubeUrl(url)))),
    [urls],
  );
  const [titlesByUrl, setTitlesByUrl] = useState<Record<string, string>>({});

  useEffect(() => {
    if (youtubeUrls.length === 0) {
      return;
    }

    let isMounted = true;
    const missingUrls = youtubeUrls.filter((url) => !titlesByUrl[url]);

    if (missingUrls.length === 0) {
      return;
    }

    async function loadTitles() {
      const entries = await Promise.all(
        missingUrls.map(async (url) => {
          try {
            const response = await fetch(
              `/api/youtube/oembed?url=${encodeURIComponent(url)}`,
            );

            if (!response.ok) {
              return [url, ""] as const;
            }

            const data = (await response.json()) as { title?: unknown };
            return [url, typeof data.title === "string" ? data.title : ""] as const;
          } catch {
            return [url, ""] as const;
          }
        }),
      );

      if (!isMounted) {
        return;
      }

      setTitlesByUrl((current) => {
        const next = { ...current };

        for (const [url, title] of entries) {
          if (title) {
            next[url] = title;
          }
        }

        return next;
      });
    }

    void loadTitles();

    return () => {
      isMounted = false;
    };
  }, [titlesByUrl, youtubeUrls]);

  return titlesByUrl;
}
