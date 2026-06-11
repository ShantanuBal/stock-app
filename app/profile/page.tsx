import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUser } from "@/lib/users";
import SignOutButton from "@/app/components/SignOutButton";

export const metadata = {
  title: "Profile · Horizon",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isGuest = session.role === "guest";
  const user = isGuest ? null : await getUser(session.username);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-1">Profile</h2>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {isGuest ? "Guest" : session.username}
        </p>
      </div>

      <div className="space-y-4">
        {/* Account details */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 divide-y divide-gray-100 dark:divide-gray-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Username</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {isGuest ? "—" : session.username}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Account type</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isGuest ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
              {isGuest ? "Guest" : "Member"}
            </span>
          </div>
          {memberSince && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Member since</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{memberSince}</span>
            </div>
          )}
        </div>

        {/* Guest upsell */}
        {isGuest && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              You&apos;re browsing as a guest. Create a free account to save your preferences and access member features.
            </p>
            <a
              href="/login"
              className="mt-3 inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
            >
              Create account
            </a>
          </div>
        )}

        {/* Sign out */}
        <SignOutButton className="w-full py-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-colors">
          Sign out
        </SignOutButton>
      </div>
    </div>
  );
}
