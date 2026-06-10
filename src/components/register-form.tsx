"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  example?: string;
};

export function RegisterForm({ example }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "注册失败");
      setLoading(false);
      return;
    }

    const signRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (signRes?.error) {
      router.push("/login");
      return;
    }

    if (example) {
      router.push(`/trips/new?example=${encodeURIComponent(example)}`);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        placeholder="昵称（可选）"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        minLength={6}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "注册中…" : "创建账号"}
      </Button>
    </form>
  );
}
