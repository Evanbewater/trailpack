import { z } from "zod";
import { corsJson, corsOptions } from "@/lib/cors";
import { createMpToken } from "@/lib/mp-token";
import { prisma } from "@/lib/db";

const schema = z.object({
  nickname: z.string().min(1).max(50).default("开发测试用户"),
});

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  const allowDev =
    process.env.MP_DEV_LOGIN === "true" ||
    process.env.NODE_ENV === "development";
  if (!allowDev) {
    return corsJson({ error: "开发登录未启用" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json().catch(() => ({})));
    const openid = `dev_${body.nickname}`;

    let user = await prisma.user.findUnique({ where: { wechatOpenId: openid } });
    if (!user) {
      user = await prisma.user.create({
        data: { wechatOpenId: openid, name: body.nickname },
      });
    }

    const token = createMpToken(user.id);
    return corsJson({
      token,
      user: { id: user.id, name: user.name, openid },
      dev: true,
    });
  } catch {
    return corsJson({ error: "开发登录失败" }, { status: 400 });
  }
}
