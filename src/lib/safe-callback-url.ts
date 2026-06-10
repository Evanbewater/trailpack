/** 仅允许站内相对路径，防止开放重定向 */
export function safeCallbackUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) {
    return "/dashboard";
  }
  return url;
}
