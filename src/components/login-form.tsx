"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ showGitHub = false }: { showGitHub?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("邮箱或密码错误");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="密码（至少 6 位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "登录中…" : "邮箱登录"}
        </Button>
      </form>
      {showGitHub && (
        <>
          <div className="relative py-2 text-center text-xs text-fog">
            <span className="bg-white/60 px-2 backdrop-blur-sm">或</span>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl })}
          >
            使用 GitHub 登录
          </Button>
        </>
      )}
      {!showGitHub && (
        <p className="text-xs text-fog">
          配置 AUTH_GITHUB_ID 与 AUTH_GITHUB_SECRET 后可启用 GitHub 登录
        </p>
      )}
    </div>
  );
}
