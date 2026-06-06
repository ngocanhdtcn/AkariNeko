export function getDisplayFileNameFromUrl(url: string, fallback: string) {
  const pathname = url.split("?")[0] ?? "";
  const fileName = pathname.split("/").pop();

  if (!fileName) {
    return fallback;
  }

  const decodedName = decodeURIComponent(fileName);
  const withoutExtension = decodedName.replace(/\.[a-z0-9]+$/i, "");
  const withoutUuid = withoutExtension.replace(
    /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "",
  );
  const readableName = withoutUuid.replace(/[-_]+/g, " ").trim();

  return readableName || fallback;
}
