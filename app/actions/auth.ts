"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { getUser, createUser } from "@/lib/users";

export type AuthState = { error?: string } | undefined;

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  console.log(`[login] called for username="${username}"`);

  if (!username || !password) return { error: "Username and password are required." };

  const user = await getUser(username);
  console.log(`[login] getUser result: ${user ? "found" : "not found"}`);
  if (!user) return { error: "Invalid username or password." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  console.log(`[login] bcrypt.compare: ${valid}`);
  if (!valid) return { error: "Invalid username or password." };

  await createSession(username, "user");
  console.log(`[login] session created, redirecting`);
  redirect("/");
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  console.log(`[register] called for username="${username}"`);

  if (!username || !password) return { error: "Username and password are required." };
  if (username.length < 3) return { error: "Username must be at least 3 characters." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!/^[a-z0-9_@.]+$/.test(username)) return { error: "Username can only contain letters, numbers, underscores, @ and ." };

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await createUser(username, passwordHash);
  } catch (e) {
    console.log(`[register] createUser failed: ${(e as Error).name} — ${(e as Error).message}`);
    return { error: "Username already taken." };
  }

  await createSession(username, "user");
  console.log(`[register] user created and session set, redirecting`);
  redirect("/");
}

export async function loginAsGuest() {
  await createSession("guest", "guest");
  redirect("/");
}

export async function logout() {
  console.log(`[logout] deleting session`);
  await deleteSession();
}
