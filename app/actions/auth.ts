"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { getUser, createUser } from "@/lib/users";

export type AuthState = { error?: string } | undefined;

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!username || !password) return { error: "Username and password are required." };

  const user = await getUser(username);
  if (!user) return { error: "Invalid username or password." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid username or password." };

  await createSession(username, "user");
  redirect("/");
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!username || !password) return { error: "Username and password are required." };
  if (username.length < 3) return { error: "Username must be at least 3 characters." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!/^[a-z0-9_@.]+$/.test(username)) return { error: "Username can only contain letters, numbers, underscores, @ and ." };

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await createUser(username, passwordHash);
  } catch {
    return { error: "Username already taken." };
  }

  await createSession(username, "user");
  redirect("/");
}

export async function loginAsGuest() {
  await createSession("guest", "guest");
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
