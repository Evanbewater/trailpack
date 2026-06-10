import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(50).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name ?? body.email.split("@")[0],
        passwordHash,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "输入无效" }, { status: 400 });
    }
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
