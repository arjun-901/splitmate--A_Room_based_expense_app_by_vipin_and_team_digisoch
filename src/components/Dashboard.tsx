import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgeIndianRupee,
  BarChart3,
  Bell,
  ChevronDown,
  Copy,
  FileClock,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { approveExpensePaymentRequest, deleteExpense, getDashboard, removeRoomMember } from "../lib/api";
import type { AppUser, DashboardData, Expense } from "../lib/types";
import ExpenseDetailsModal from "./ExpenseDetailsModal";
import ExpenseForm from "./ExpenseForm";

type DashboardSection =
  | "overview"
  | "add-expense"
  | "all-expenses"
  | "members"
  | "monthly-reports"
  | "settings";

interface Props {
  user: AppUser;
  roomCode: string;
  section: DashboardSection;
  onBackToRooms: () => void;
  onLogout: () => void;
}

type NavItem = {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "add-expense", label: "Add Expense", icon: BadgeIndianRupee },
  { id: "all-expenses", label: "All Expenses", icon: Receipt },
  { id: "members", label: "Members", icon: Users },
  { id: "monthly-reports", label: "Monthly Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatMoney(value: number) {
  return `₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <img
      alt={name}
      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`}
      style={{ width: size, height: size }}
      className="rounded-full border border-gray-100 bg-gray-50 shrink-0"
    />
  );
}

function BalanceBadge({ amount }: { amount: number }) {
  const tone =
    amount > 0
      ? "bg-emerald-50 text-emerald-600"
      : amount < 0
        ? "bg-red-50 text-red-500"
        : "bg-gray-100 text-gray-500";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {amount > 0 ? "+" : amount < 0 ? "–" : ""}
      {formatMoney(amount)}
    </span>
  );
}

function Card({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-50 px-4 py-3">
          <p className="text-[14px] font-bold text-gray-900">{title}</p>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function sectionPath(roomCode: string, item: DashboardSection) {
  const base = `/dashboard/${roomCode}`;
  if (item === "overview") {
    return base;
  }
  return `${base}/${item}`;
}

export default function Dashboard({ user, roomCode, section, onBackToRooms, onLogout }: Props) {
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(section === "add-expense");
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getDashboard(roomCode, monthFilter);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Dashboard load nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [roomCode, monthFilter]);

  useEffect(() => {
    setShowExpenseForm(section === "add-expense");
  }, [section]);

  const paymentRequests = data?.paymentRequests || [];
  const expenses = data?.expenses || [];
  const memberProfiles = data?.memberProfiles || {};
  const balances = data?.balances || [];
  const roomMembers = data?.room?.members || [];

  const membersWithBalance = useMemo(
    () =>
      roomMembers.map((memberId) => ({
        id: memberId,
        profile: memberProfiles[memberId],
        balance: balances.find((entry) => entry.userId === memberId)?.amount || 0,
      })),
    [balances, memberProfiles, roomMembers],
  );

  const chartBuckets = useMemo(() => {
    const labels = ["1-7", "8-14", "15-21", "22-28", "29-31"];
    const totals = new Map<string, number>();
    for (const expense of expenses) {
      const day = Number(expense.date.slice(-2));
      const rangeStart = Math.floor((day - 1) / 7) * 7 + 1;
      const rangeEnd = Math.min(rangeStart + 6, 31);
      const key = `${rangeStart}-${rangeEnd}`;
      totals.set(key, (totals.get(key) || 0) + expense.amount);
    }
    const maxValue = Math.max(...labels.map((label) => totals.get(label) || 0), 1);
    return labels.map((label) => ({
      label,
      amount: totals.get(label) || 0,
      height: Math.max(8, Math.round(((totals.get(label) || 0) / maxValue) * 100)),
    }));
  }, [expenses]);

  const recentExpenses = useMemo(() => expenses.slice(0, 4), [expenses]);
  const quickSummary = useMemo(() => [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 4), [expenses]);
  const pendingApprovals = useMemo(
    () => paymentRequests.filter((request) => request.status === "pending" && request.approverId === user.id),
    [paymentRequests, user.id],
  );
  const waitingForApproval = useMemo(
    () => paymentRequests.filter((request) => request.status === "pending" && request.requesterId === user.id),
    [paymentRequests, user.id],
  );

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm("Is expense ko delete karna hai?")) {
      return;
    }
    try {
      await deleteExpense(expenseId);
      await loadDashboard();
    } catch (err: any) {
      window.alert(err.message || "Expense delete nahi hua");
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setApprovingRequestId(requestId);
    try {
      await approveExpensePaymentRequest(requestId);
      await loadDashboard();
    } catch (err: any) {
      window.alert(err.message || "Approval nahi hua");
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Is member ko room se remove karna hai?")) {
      return;
    }

    try {
      await removeRoomMember(roomCode, memberId);
      await loadDashboard();
    } catch (err: any) {
      window.alert(err.message || "Member remove nahi hua");
    }
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${
        mobile ? "fixed inset-0 z-50 flex" : "hidden w-[210px] shrink-0 border-r border-gray-100 lg:flex"
      } bg-white`}
    >
      {mobile && <div className="absolute inset-0 bg-black/30" onClick={() => setMobileSidebarOpen(false)} />}
      <div className={`${mobile ? "relative z-10 h-full w-[210px] shadow-xl" : "h-full"} flex flex-col bg-white`}>
        <div className="flex items-center justify-between gap-2.5 border-b border-gray-100 px-4 py-4">
          <Link to="/" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
              <Wallet size={13} className="text-white" />
            </div>
            <p className="text-[14px] font-bold text-gray-900">SplitRoom</p>
          </Link>
          {mobile && (
            <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-gray-400">
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <Link
                key={item.id}
                to={sectionPath(roomCode, item.id)}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  active ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={14} className={active ? "text-white" : "text-gray-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-2 mb-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[12px] font-bold tracking-widest text-gray-900">{roomCode}</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(roomCode);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600"
            >
              <Copy size={10} />
              {copied ? "✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  const renderOverview = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_280px]">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Expense</p>
          <p className="mt-3 text-[26px] font-bold tracking-tight text-gray-900">{formatMoney(data!.summary.totalExpense)}</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Your Balance</p>
          <p
            className={`mt-3 text-[26px] font-bold tracking-tight ${
              data!.summary.yourBalance > 0
                ? "text-emerald-600"
                : data!.summary.yourBalance < 0
                  ? "text-red-500"
                  : "text-gray-900"
            }`}
          >
            {data!.summary.yourBalance > 0 ? "+" : data!.summary.yourBalance < 0 ? "–" : ""}
            {formatMoney(data!.summary.yourBalance)}
          </p>
        </Card>

        <Card title="Members">
          <div className="space-y-2 p-3">
            {membersWithBalance.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar name={member.profile?.displayName || member.id} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-900">{member.profile?.displayName || "Unknown"}</p>
                </div>
                <BalanceBadge amount={member.balance} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
        <Card
          title="Monthly Expenses"
          right={
            <div className="relative">
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className="appearance-none rounded-xl border border-gray-100 bg-gray-50 py-1.5 pl-3 pr-7 text-[12px] font-semibold text-gray-700 outline-none"
              >
                <option value={monthFilter}>{format(parseISO(`${monthFilter}-01`), "MMMM yyyy")}</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          }
        >
          <div className="px-4 pb-4">
            <div className="flex h-44 items-end gap-2 sm:gap-3">
              {chartBuckets.map((bucket, index) => (
                <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-36 w-full items-end justify-center">
                    <div
                      className="w-full rounded-t-lg bg-gray-800"
                      style={{
                        height: `${bucket.height}%`,
                        animation: `growUp 0.55s cubic-bezier(.22,1,.36,1) both`,
                        animationDelay: `${index * 60}ms`,
                      }}
                      title={`${bucket.label}: ${formatMoney(bucket.amount)}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Recent Expenses">
          <div className="divide-y divide-gray-50 px-4">
            {quickSummary.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No expenses yet</div>
            ) : (
              quickSummary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedExpense(item)}
                  className="grid w-full grid-cols-[1fr_auto] gap-2 py-3 text-left"
                >
                  <span className="truncate text-[13px] font-medium text-gray-800">{item.description}</span>
                  <span className="text-[13px] font-bold text-gray-900">{formatMoney(item.amount)}</span>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card title="Waiting for payer approval">
          <div className="space-y-2 p-3">
            {waitingForApproval.length === 0 ? (
              <div className="rounded-xl border border-gray-100 px-3 py-4 text-center text-sm text-gray-400">No pending requests</div>
            ) : (
              waitingForApproval.slice(0, 4).map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-gray-900">
                      {memberProfiles[request.approverId]?.displayName || request.approverId}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatMoney(request.amount)}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">Waiting</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Approve">
          <div className="space-y-2 p-3">
            {pendingApprovals.length === 0 ? (
              <div className="rounded-xl border border-gray-100 px-3 py-4 text-center text-sm text-gray-400">No approvals</div>
            ) : (
              pendingApprovals.slice(0, 4).map((request) => (
                <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-gray-900">
                      {memberProfiles[request.requesterId]?.displayName || request.requesterId}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatMoney(request.amount)}</p>
                  </div>
                  <button
                    onClick={() => void handleApproveRequest(request.id)}
                    disabled={approvingRequestId === request.id}
                    className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-60"
                  >
                    {approvingRequestId === request.id ? "..." : "Approve"}
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAllExpenses = () => (
    <Card title="All Expenses">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-gray-50 bg-gray-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        <span>Title</span>
        <span>Paid By</span>
        <span className="hidden sm:block">Date</span>
        <span className="text-right">Amount</span>
      </div>
      {expenses.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400">No expenses yet</div>
      ) : (
        expenses.map((expense) => (
          <div
            key={expense.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedExpense(expense)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedExpense(expense);
              }
            }}
            className="grid cursor-pointer grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center border-t border-gray-50 px-4 py-3 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-gray-900">{expense.description}</p>
              <p className="text-[10px] text-gray-400">{expense.category}</p>
            </div>
            <span className="text-[12px] font-medium text-gray-600">{memberProfiles[expense.paidBy]?.displayName || "Unknown"}</span>
            <span className="hidden text-[11px] text-gray-400 sm:block">{format(parseISO(expense.date), "dd MMM yyyy")}</span>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[13px] font-bold text-gray-900">{formatMoney(expense.amount)}</span>
              {expense.authorId === user.id && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDelete(expense.id);
                  }}
                  className="rounded-lg border border-gray-100 p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Receipt size={11} />
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </Card>
  );

  const renderMembers = () => (
    <Card title="Members">
      <div className="space-y-2 p-4">
        {membersWithBalance.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
            <Avatar name={member.profile?.displayName || member.id} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gray-900">{member.profile?.displayName || "Unknown"}</p>
              <p className="truncate text-[10px] text-gray-400">{member.id === user.id ? "You" : member.profile?.email}</p>
            </div>
            <BalanceBadge amount={member.balance} />
            {data?.room.createdBy === user.id && member.id !== user.id && (
              <button
                onClick={() => void handleRemoveMember(member.id)}
                className="rounded-lg border border-red-100 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <Card title="Monthly Reports">
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {chartBuckets.map((bucket) => (
            <div key={bucket.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-400">{bucket.label}</p>
              <p className="mt-2 text-[17px] font-bold text-gray-900">{formatMoney(bucket.amount)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Monthly Chart">
        <div className="px-4 pb-4">
          <div className="flex h-44 items-end gap-2 sm:gap-3">
            {chartBuckets.map((bucket, index) => (
              <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-36 w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-lg bg-gray-800"
                    style={{
                      height: `${bucket.height}%`,
                      animation: `growUp 0.55s cubic-bezier(.22,1,.36,1) both`,
                      animationDelay: `${index * 60}ms`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{bucket.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <Card title="Settings">
      <div className="space-y-2 p-3">
        <button
          onClick={onBackToRooms}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Switch Room</span>
          <FileClock size={14} className="text-gray-400" />
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-red-50"
        >
          <span>Logout</span>
          <LogOut size={14} className="text-gray-400" />
        </button>
      </div>
    </Card>
  );

  const renderMainSection = () => {
    switch (section) {
      case "overview":
        return renderOverview();
      case "all-expenses":
        return renderAllExpenses();
      case "members":
        return renderMembers();
      case "monthly-reports":
        return renderReports();
      case "settings":
        return renderSettings();
      case "add-expense":
        return renderAllExpenses();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-base font-semibold text-gray-900">{error || "Room access unavailable"}</p>
          <button onClick={onBackToRooms} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            Back to rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8] font-sans text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .dash-scroll { scrollbar-width: none; }
        .dash-scroll::-webkit-scrollbar { display: none; }
        @keyframes growUp { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); transform-origin: bottom; } }
      `}</style>

      <div className="flex min-h-screen overflow-hidden">
        <Sidebar />

        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Sidebar mobile />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50 lg:hidden">
              <Menu size={18} />
            </button>

            <div className="relative w-full max-w-md flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2 pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button className="relative rounded-xl border border-gray-100 bg-white p-2 hover:bg-gray-50">
                <Bell size={15} className="text-gray-500" />
                {pendingApprovals.length > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((value) => !value)}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-2 py-1.5 hover:bg-gray-50"
                >
                  <Avatar name={user.displayName} size={28} />
                  <ChevronDown size={13} className="text-gray-400" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[calc(100%+6px)] z-30 w-36 rounded-xl border border-gray-100 bg-white p-1 shadow-lg"
                    >
                      <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-red-500 hover:bg-red-50"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="dash-scroll flex-1 overflow-y-auto px-2 py-2 sm:px-2.5 md:px-3">
            <div className="mx-auto max-w-7xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-[20px] font-bold tracking-tight text-gray-900">
                    {navItems.find((item) => item.id === section)?.label || "Dashboard"}
                  </h1>
                </div>
                <button
                  onClick={onBackToRooms}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Switch Room
                </button>
              </div>

              {renderMainSection()}
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {showExpenseForm && (
          <ExpenseForm
            user={user}
            roomCode={roomCode}
            members={roomMembers}
            memberProfiles={memberProfiles}
            onClose={() => setShowExpenseForm(false)}
            onSaved={async () => {
              setShowExpenseForm(false);
              await loadDashboard();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedExpense && (
          <ExpenseDetailsModal
            user={user}
            expense={selectedExpense}
            memberProfiles={memberProfiles}
            paymentRequests={paymentRequests.filter((request) => request.expenseId === selectedExpense.id)}
            onClose={() => setSelectedExpense(undefined)}
            onChanged={async () => {
              const fresh = await getDashboard(roomCode, monthFilter);
              setData(fresh);
              setSelectedExpense((fresh.expenses || []).find((expense) => expense.id === selectedExpense.id));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
