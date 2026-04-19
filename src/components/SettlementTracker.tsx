import React, { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, WalletCards } from "lucide-react";
import { createSettlement, updateSettlementStatus } from "../lib/api";
import type { AppUser, Balance, Settlement } from "../lib/types";

interface Props {
  user: AppUser;
  roomCode: string;
  members: Record<string, AppUser>;
  balances: Balance[];
  settlements: Settlement[];
  onChanged: () => void;
}

export default function SettlementTracker({ user, roomCode, members, balances, settlements, onChanged }: Props) {
  const [targetMemberId, setTargetMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const memberOptions = useMemo(
    () =>
      Object.values(members)
        .filter((member) => member.id !== user.id)
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [members, user.id],
  );

  const youBalance = balances.find((entry) => entry.userId === user.id)?.amount || 0;

  const handleCreateSettlement = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const numericAmount = Number(amount || 0);

      if (!targetMemberId) {
        throw new Error("Member select karo.");
      }

      if (!numericAmount || numericAmount <= 0) {
        throw new Error("Valid amount enter karo.");
      }

      const from = youBalance <= 0 ? user.id : targetMemberId;
      const to = youBalance <= 0 ? targetMemberId : user.id;

      await createSettlement({
        roomCode,
        from,
        to,
        amount: numericAmount,
      });

      setTargetMemberId("");
      setAmount("");
      await onChanged();
    } catch (err: any) {
      setError(err.message || "Settlement create nahi hua");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSettlement = async (id: string) => {
    try {
      await updateSettlementStatus(id, "settled");
      await onChanged();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-accent text-brand-primary">
          <WalletCards size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Settlements</p>
          <h2 className="text-lg font-black text-slate-950">Quick action</h2>
        </div>
      </div>

      <form onSubmit={handleCreateSettlement} className="mt-4 grid gap-2">
        <select
          value={targetMemberId}
          onChange={(event) => setTargetMemberId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
        >
          <option value="">Select member</option>
          {memberOptions.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Settlement amount"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
        />

        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white"
        >
          {loading ? <Loader2 className="mx-auto animate-spin" size={15} /> : "Create settlement"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Recent</p>
          <div className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {settlements.length}
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500">
            No settlement records.
          </div>
        ) : (
          settlements.slice(0, 4).map((settlement) => {
            const fromName = members[settlement.from]?.displayName || settlement.from;
            const toName = members[settlement.to]?.displayName || settlement.to;
            const canConfirm =
              settlement.status === "pending" &&
              (settlement.from === user.id || settlement.to === user.id);

            return (
              <div key={settlement.id} className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                        settlement.status === "settled"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {settlement.status === "settled" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {fromName} paid {toName}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        ₹{settlement.amount.toLocaleString("en-IN")} • {settlement.status}
                      </p>
                    </div>
                  </div>

                  {canConfirm && (
                    <button
                      onClick={() => handleConfirmSettlement(settlement.id)}
                      className="rounded-lg bg-slate-950 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
