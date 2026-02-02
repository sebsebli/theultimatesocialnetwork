"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporterId: string;
};

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const userRole = (user as { role?: string })?.role;
    if (!user || userRole !== "admin") {
      router.replace("/home");
    } else {
      fetchReports();
    }
  }, [user, isLoading, router]);

  const fetchReports = async () => {
    try {
      const res = await fetchWithRetry("/api/admin/reports?status=OPEN");
      if (res.ok) {
        const data = await res.json();
        setReports(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      await fetchWithRetry(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEWED" }),
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (userId: string, id: string) => {
    if (!confirm("Are you sure you want to ban this user?")) return;
    setActionLoading(id);
    try {
      await fetchWithRetry(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin Action" }),
      });
      handleResolve(id); // Also resolve the report
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading || !user) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-paper">Admin Dashboard</h1>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 font-semibold text-tertiary">
          Open Reports
        </div>
        <div className="divide-y divide-white/10">
          {reports.length === 0 ? (
            <div className="p-8 text-center text-secondary">
              No open reports.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold uppercase mr-2">
                      {report.targetType}
                    </span>
                    <span className="text-paper font-medium">
                      {report.reason}
                    </span>
                  </div>
                  <span className="text-xs text-tertiary">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-secondary font-mono bg-black/20 p-2 rounded truncate">
                  Target: {report.targetId}
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleResolve(report.id)}
                    disabled={!!actionLoading}
                    className="text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
                  >
                    Dismiss / Resolve
                  </button>
                  {report.targetType === "USER" && (
                    <button
                      onClick={() => handleBan(report.targetId, report.id)}
                      disabled={!!actionLoading}
                      className="text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded transition-colors"
                    >
                      Ban User
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
