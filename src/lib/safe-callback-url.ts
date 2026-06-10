const BLOCKED = new Set(["/login", "/register"]);

/** 仅允许站内相对路径，防止开放重定向与登录页循环 */
export function safeCallbackUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) {
    return "/dashboard";
  }
  const path = url.split("?")[0] ?? url;
  if (BLOCKED.has(path)) {
    return "/dashboard";
  }
  return url;
}
