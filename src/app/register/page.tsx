import { RegisterForm } from "@/components/register-form";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ example?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { example } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-paper">注册</h1>
        <p className="mt-2 text-sm text-fog">
          已有账号？{" "}
          <Link
            href="/login"
            className="cursor-pointer font-medium text-primary hover:text-dawn-bright"
          >
            登录
          </Link>
        </p>
        {example && (
          <p className="mt-3 rounded-xl bg-meadow/60 px-3 py-2 text-xs text-forest">
            注册后将自动带入示例路线，可直接生成清单
          </p>
        )}
        <div className="mt-8">
          <RegisterForm example={example} />
        </div>
      </div>
    </div>
  );
}
