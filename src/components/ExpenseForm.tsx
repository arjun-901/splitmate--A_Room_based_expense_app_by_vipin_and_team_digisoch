import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Loader2, Receipt, X } from "lucide-react";
import { addExpense, updateExpense } from "../lib/api";
import type { AppUser, Expense, ExpenseShare } from "../lib/types";

interface Props {
  user: AppUser;
  roomCode: string;
  members: string[];
  memberProfiles: Record<string, AppUser>;
  onClose: () => void;
  onSaved: () => void;
  editExpense?: Expense;
}

const categories = ["Food", "Travel", "Rent", "Utilities", "Shopping", "Entertainment", "General"];

export default function ExpenseForm({
  user,
  roomCode,
  members,
  memberProfiles,
  onClose,
  onSaved,
  editExpense,
}: Props) {
  const [amount, setAmount] = useState(editExpense ? String(editExpense.amount) : "");
  const [description, setDescription] = useState(editExpense?.description || "");
  const [category, setCategory] = useState(editExpense?.category || "General");
  const [date, setDate] = useState(editExpense?.date || new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState(editExpense?.paidBy || user.id);
  const [splitType, setSplitType] = useState<"equal" | "custom">(editExpense?.splitType || "equal");
  const [splitBetween, setSplitBetween] = useState<string[]>(
    editExpense?.splitBetween?.length ? editExpense.splitBetween : members,
  );
  const [customShares, setCustomShares] = useState<Record<string, string>>(
    Object.fromEntries((editExpense?.shares || []).map((share) => [share.userId, String(share.share)])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericAmount = Number(amount || 0);
  const equalShare = splitBetween.length > 0 ? numericAmount / splitBetween.length : 0;

  const generatedShares = useMemo<ExpenseShare[]>(() => {
    if (splitType === "equal") {
      return splitBetween.map((memberId) => ({
        userId: memberId,
        share: Number(equalShare.toFixed(2)),
      }));
    }

    return splitBetween.map((memberId) => ({
      userId: memberId,
      share: Number(customShares[memberId] || 0),
    }));
  }, [customShares, equalShare, splitBetween, splitType]);

  const customTotal = generatedShares.reduce((sum, share) => sum + share.share, 0);

  const toggleMember = (memberId: string) => {
    setSplitBetween((current) => {
      if (current.includes(memberId)) {
        if (current.length === 1) {
          return current;
        }

        const next = current.filter((entry) => entry !== memberId);
        if (splitType === "custom") {
          const nextShares = { ...customShares };
          delete nextShares[memberId];
          setCustomShares(nextShares);
        }
        return next;
      }

      return [...current, memberId];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!numericAmount || numericAmount <= 0) {
      setError("Valid amount enter karo.");
      return;
    }

    if (splitBetween.length === 0) {
      setError("Kam se kam ek member select karo.");
      return;
    }

    if (splitType === "custom" && Math.abs(customTotal - numericAmount) > 0.01) {
      setError("Custom shares total amount ke equal hone chahiye.");
      return;
    }

    setLoading(true);

    try {
      const expensePayload = {
        amount: numericAmount,
        description,
        category,
        date,
        paidBy,
        splitType,
        splitBetween,
        shares: splitType === "custom" ? generatedShares : undefined,
      };

      if (editExpense) {
        await updateExpense(editExpense.id, { expense: expensePayload });
      } else {
        await addExpense({ roomCode, expense: expensePayload });
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || "Expense save nahi hua");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-1.5 sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative max-h-[98vh] w-full max-w-3xl overflow-y-auto rounded-[1.35rem] border border-white/70 bg-white p-3 shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:max-h-[92vh] sm:rounded-[2rem] sm:p-5"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 sm:gap-4 sm:pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary sm:text-xs">Room {roomCode}</p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
              {editExpense ? "Edit expense" : "Add expense"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-900 hover:text-slate-950 sm:rounded-2xl sm:p-3"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-3 sm:rounded-[1.4rem] sm:p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:text-xs">Amount</p>
            <input
              required
              autoFocus
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="mt-1.5 w-full bg-transparent text-[1.7rem] font-black tracking-tight text-slate-950 outline-none placeholder:text-slate-300 sm:mt-2 sm:text-4xl"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:mb-2 sm:text-xs">Description</span>
              <input
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Dinner, rent, cab"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.75 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-brand-primary sm:px-3.5 sm:py-3 sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:mb-2 sm:text-xs">Date</span>
              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.75 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-brand-primary sm:px-3.5 sm:py-3 sm:text-sm"
              />
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:mb-2 sm:text-xs">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.75 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-brand-primary sm:px-3.5 sm:py-3 sm:text-sm"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:mb-2 sm:text-xs">Paid by</span>
              <select
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.75 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-brand-primary sm:px-3.5 sm:py-3 sm:text-sm"
              >
                {members.map((memberId) => (
                  <option key={memberId} value={memberId}>
                    {memberProfiles[memberId]?.displayName || memberId}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[1.1rem] border border-slate-200 p-3 sm:rounded-[1.4rem] sm:p-4">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 sm:text-xs">Split type</p>
                <h3 className="mt-1 text-base font-black text-slate-950 sm:mt-1.5 sm:text-lg">Select members and split logic</h3>
              </div>
              <div className="grid w-full grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 md:w-auto">
                <button
                  type="button"
                  onClick={() => setSplitType("equal")}
                  className={`rounded-lg px-3 py-2 text-[13px] font-black transition sm:px-3.5 sm:py-2.5 sm:text-sm ${splitType === "equal" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType("custom")}
                  className={`rounded-lg px-3 py-2 text-[13px] font-black transition sm:px-3.5 sm:py-2.5 sm:text-sm ${splitType === "custom" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
              {members.map((memberId) => {
                const selected = splitBetween.includes(memberId);
                return (
                  <button
                    key={memberId}
                    type="button"
                    onClick={() => toggleMember(memberId)}
                    className={`inline-flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[12px] font-black transition sm:gap-2.5 sm:px-3 sm:py-2.5 sm:text-[13px] ${
                      selected ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <img
                      alt={memberProfiles[memberId]?.displayName || memberId}
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(memberProfiles[memberId]?.displayName || memberId)}`}
                      className="h-7 w-7 rounded-lg border border-white/80 bg-white sm:h-8 sm:w-8"
                    />
                    <span className="min-w-0 flex-1 truncate">{memberProfiles[memberId]?.displayName || memberId}</span>
                    {selected && <Check size={12} className="shrink-0 sm:h-[14px] sm:w-[14px]" />}
                  </button>
                );
              })}
            </div>

            {splitType === "equal" ? (
              <p className="mt-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-600 sm:mt-3 sm:px-3.5 sm:py-3 sm:text-[13px]">
                Each selected member will be assigned approximately <span className="font-black text-slate-950">₹{equalShare.toFixed(2)}</span>.
              </p>
            ) : (
              <div className="mt-2.5 grid gap-2 sm:mt-3 sm:gap-2 md:grid-cols-2">
                {splitBetween.map((memberId) => (
                  <label key={memberId} className="block rounded-xl bg-slate-50 px-3 py-2.5 sm:px-3.5 sm:py-3">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 sm:text-[10px]">
                      {memberProfiles[memberId]?.displayName || memberId}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customShares[memberId] || ""}
                      onChange={(event) =>
                        setCustomShares((current) => ({
                          ...current,
                          [memberId]: event.target.value,
                        }))
                      }
                      className="w-full bg-transparent text-lg font-black text-slate-950 outline-none placeholder:text-slate-300 sm:text-xl"
                      placeholder="0.00"
                    />
                  </label>
                ))}
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-[12px] font-semibold text-slate-600 sm:px-3.5 sm:py-3 sm:text-[13px]">
                  Total custom share: <span className="font-black text-slate-950">₹{customTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-red-600 sm:px-3.5 sm:py-3 sm:text-[13px]">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 sm:text-[13px] sm:tracking-[0.18em]"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Receipt size={16} />}
            {editExpense ? "Update expense" : "Save expense"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
