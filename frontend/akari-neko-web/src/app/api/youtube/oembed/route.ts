import { NextResponse } from "next/server";
import { isYouTubeUrl } from "@/lib/youtube";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() ?? "";

  if (!url || !isYouTubeUrl(url)) {
    return NextResponse.json({ error: "Invalid YouTube URL." }, { status: 400 });
  }

  const oembedUrl = new URL("https://www.youtube.com/oembed");
  oembedUrl.searchParams.set("url", url);
  oembedUrl.searchParams.set("format", "json");

  const response = await fetch(oembedUrl, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Cannot load YouTube metadata." },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { title?: unknown };

  return NextResponse.json({
    title: typeof data.title === "string" ? data.title : "",
  });
}
