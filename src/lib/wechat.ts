type Code2SessionResult = {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export function isWeChatConfigured(): boolean {
  return Boolean(
    process.env.WECHAT_APP_ID?.trim() && process.env.WECHAT_APP_SECRET?.trim(),
  );
}

export async function code2Session(code: string): Promise<{
  openid: string;
  unionid?: string;
}> {
  const appId = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appId || !secret) {
    throw new Error("WECHAT_APP_ID / WECHAT_APP_SECRET 未配置");
  }

  const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
  url.searchParams.set("appid", appId);
  url.searchParams.set("secret", secret);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const res = await fetch(url.toString());
  const data = (await res.json()) as Code2SessionResult;

  if (data.errcode || !data.openid) {
    throw new Error(data.errmsg ?? `微信登录失败 (${data.errcode})`);
  }

  return { openid: data.openid, unionid: data.unionid };
}
