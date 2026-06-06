export function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url.trim());
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v") ?? "";
      }

      const [kind, id] = parsedUrl.pathname.split("/").filter(Boolean);

      if (kind === "embed" || kind === "shorts" || kind === "live") {
        return id ?? "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function isYouTubeUrl(url: string) {
  return getYouTubeVideoId(url).length > 0;
}

export function getYouTubeEmbedUrl(url: string) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}
