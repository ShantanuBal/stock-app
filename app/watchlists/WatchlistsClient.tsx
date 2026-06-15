"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { WatchList } from "@/lib/watchlists";
import {
  createWatchList, deleteWatchList, renameWatchList, removeFromWatchList,
} from "@/app/actions/watchlists";
import AddTickerSearch from "@/app/components/AddTickerSearch";

export default function WatchlistsClient({ initialLists }: { initialLists: WatchList[] }) {
  const [lists, setLists] = useState<WatchList[]>(initialLists);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createWatchList(newName.trim());
      if ("error" in result) { setError(result.error); return; }
      const newList: WatchList = {
        username: "", listId: result.listId, name: newName.trim(),
        tickers: [], createdAt: new Date().toISOString(),
      };
      setLists((prev) => [...prev, newList]);
      setNewName("");
    });
  }

  async function handleDelete(listId: string) {
    startTransition(async () => {
      await deleteWatchList(listId);
      setLists((prev) => prev.filter((l) => l.listId !== listId));
    });
  }

  async function handleRename(listId: string) {
    if (!editName.trim()) return;
    startTransition(async () => {
      await renameWatchList(listId, editName.trim());
      setLists((prev) => prev.map((l) => l.listId === listId ? { ...l, name: editName.trim() } : l));
      setEditingId(null);
    });
  }

  async function handleRemoveTicker(listId: string, ticker: string) {
    startTransition(async () => {
      await removeFromWatchList(listId, ticker);
      setLists((prev) => prev.map((l) =>
        l.listId === listId ? { ...l, tickers: l.tickers.filter((t) => t !== ticker) } : l
      ));
    });
  }

  return (
    <div className="max-w-2xl pt-6">
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-1">
          Watchlists
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your personal stock lists — view live prices from the{" "}
          <Link href="/" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2">Equities tab</Link>.
        </p>
      </div>

      {/* Create new list */}
      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New list name (e.g. Tech Stocks)"
          maxLength={50}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={isPending || !newName.trim()}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
        >
          Create
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {lists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">No watchlists yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <div key={list.listId} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
              {/* List header */}
              <div className="flex items-center justify-between mb-3">
                {editingId === list.listId ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(list.listId); if (e.key === "Escape") setEditingId(null); }}
                      maxLength={50}
                      className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button onClick={() => handleRename(list.listId)} className="text-xs font-medium text-emerald-500 hover:text-emerald-400">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{list.name}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-600">{list.tickers.length} ticker{list.tickers.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/?watchlist=${list.listId}&range=1D`}
                    className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    View live →
                  </Link>
                  {editingId !== list.listId && (
                    <button
                      onClick={() => { setEditingId(list.listId); setEditName(list.name); }}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      Rename
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(list.listId)}
                    disabled={isPending}
                    className="text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Tickers */}
              {list.tickers.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-600 italic">
                  No tickers yet — search below to add them, or from the{" "}
                  <Link href="/" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2">Equities tab</Link>.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {list.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {ticker}
                      <button
                        onClick={() => handleRemoveTicker(list.listId, ticker)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-0.5 text-xs font-semibold leading-none"
                        aria-label={`Remove ${ticker}`}
                      >
                        −
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add tickers via search */}
              <AddTickerSearch
                listId={list.listId}
                existing={list.tickers}
                disabled={isPending}
                onAdded={(ticker) =>
                  setLists((prev) => prev.map((l) =>
                    l.listId === list.listId ? { ...l, tickers: [...l.tickers, ticker] } : l
                  ))
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
