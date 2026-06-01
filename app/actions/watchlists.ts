"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  createList, deleteList, renameList, addTicker, removeTicker,
} from "@/lib/watchlists";

async function requireUser() {
  const session = await getSession();
  if (!session || session.role !== "user") throw new Error("Not authenticated");
  return session.username;
}

export async function createWatchList(name: string): Promise<{ listId: string } | { error: string }> {
  try {
    const username = await requireUser();
    if (!name.trim()) return { error: "Name is required" };
    const list = await createList(username, name);
    revalidatePath("/watchlists");
    return { listId: list.listId };
  } catch {
    return { error: "Failed to create list" };
  }
}

export async function deleteWatchList(listId: string): Promise<{ error?: string }> {
  try {
    const username = await requireUser();
    await deleteList(username, listId);
    revalidatePath("/watchlists");
    return {};
  } catch {
    return { error: "Failed to delete list" };
  }
}

export async function renameWatchList(listId: string, name: string): Promise<{ error?: string }> {
  try {
    const username = await requireUser();
    if (!name.trim()) return { error: "Name is required" };
    await renameList(username, listId, name);
    revalidatePath("/watchlists");
    return {};
  } catch {
    return { error: "Failed to rename list" };
  }
}

export async function addToWatchList(listId: string, ticker: string): Promise<{ error?: string }> {
  try {
    const username = await requireUser();
    await addTicker(username, listId, ticker);
    return {};
  } catch {
    return { error: "Failed to add ticker" };
  }
}

export async function removeFromWatchList(listId: string, ticker: string): Promise<{ error?: string }> {
  try {
    const username = await requireUser();
    await removeTicker(username, listId, ticker);
    return {};
  } catch {
    return { error: "Failed to remove ticker" };
  }
}
