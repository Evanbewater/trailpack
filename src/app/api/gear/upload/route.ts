import { corsJson, corsOptions } from "@/lib/cors";
import { saveGearImage } from "@/lib/gear/upload-image";
import { getUserIdFromRequest } from "@/lib/request-auth";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return corsJson({ error: "请选择图片文件" }, { status: 400 });
    }

    const imageUrl = await saveGearImage(userId, file);
    return corsJson({ imageUrl }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "上传失败";
    return corsJson({ error: message }, { status: 400 });
  }
}
