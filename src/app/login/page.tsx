import { LoginForm } from "@/components/login-form";
import { isGitHubConfigured } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  const showGitHub = isGitHubConfigured();
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-paper">登录 Trailpack</h1>
        <p className="mt-2 text-sm text-fog">
          还没有账号？{" "}
          <Link
            href="/register"
            className="cursor-pointer font-medium text-primary hover:text-dawn-bright"
          >
            注册
          </Link>
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-fog">加载中…</p>}>
            <LoginForm showGitHub={showGitHub} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
