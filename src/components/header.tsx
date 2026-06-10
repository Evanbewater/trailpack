import Link from "next/link";
import { Mountain } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="glass-nav mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl px-4">
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-2 font-display text-base font-semibold tracking-tight text-paper transition-colors duration-200 hover:text-forest"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-canopy text-white shadow-sm">
            <Mountain className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Trailpack
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="cursor-pointer font-medium text-mist transition-colors duration-200 hover:text-paper"
              >
                我的行程
              </Link>
              <Link
                href="/gear"
                className="cursor-pointer font-medium text-mist transition-colors duration-200 hover:text-paper"
              >
                装备库
              </Link>
              <Link
                href="/trips/new"
                className="cursor-pointer font-medium text-mist transition-colors duration-200 hover:text-paper"
              >
                新建
              </Link>
              <span className="hidden text-fog sm:inline">{session.user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="cursor-pointer font-medium text-mist transition-colors duration-200 hover:text-paper"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn-cta cursor-pointer rounded-xl px-4 py-1.5 text-sm font-bold"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
