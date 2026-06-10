import { NextResponse } from "next/server";
import { z } from "zod";
import { corsJson, corsOptions } from "@/lib/cors";
import { createMpToken } from "@/lib/mp-token";
import { prisma } from "@/lib/db";
import { code2Session, isWeChatConfigured } from "@/lib/wechat";

const schema = z.object({
  code: z.string().min(1),
  nickname: z.string().max(50).optional(),
});

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  if (!isWeChatConfigured()) {
    return corsJson(
      { error: "微信 AppID/Secret 未配置，开发环境请使用 /api/mp/auth/dev-login" },
      { status: 503 },
    );
  }

  try {
    const body = schema.parse(await req.json());
    const { openid, unionid } = await code2Session(body.code);

    let user = await prisma.user.findUnique({ where: { wechatOpenId: openid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          wechatOpenId: openid,
          name: body.nickname ?? `户外用户${openid.slice(-4)}`,
        },
      });
    } else if (body.nickname && body.nickname !== user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: body.nickname },
      });
    }

    const token = createMpToken(user.id);
    return corsJson({
      token,
      user: { id: user.id, name: user.name, openid, unionid },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "登录失败";
    return corsJson({ error: message }, { status: 400 });
  }
}
