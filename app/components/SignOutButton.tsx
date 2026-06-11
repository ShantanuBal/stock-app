"use client";

import { useTransition } from "react";
import { logout } from "@/app/actions/auth";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function SignOutButton({ className, children }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          // Hard navigation so all client state (watchlist tabs, etc.) resets
          window.location.assign("/");
        })
      }
      className={`${className} disabled:opacity-50`}
    >
      {isPending ? "Signing out…" : children}
    </button>
  );
}
