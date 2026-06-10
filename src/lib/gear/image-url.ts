/** 小程序等场景需补全 API 域名 */
export function resolveGearImageUrl(
  imageUrl: string | null | undefined,
  baseUrl?: string,
): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (baseUrl) return `${baseUrl.replace(/\/$/, "")}${imageUrl}`;
  return imageUrl;
}
