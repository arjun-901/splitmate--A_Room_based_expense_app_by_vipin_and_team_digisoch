import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, Loader2, Pencil, X } from "lucide-react";
import { approveExpensePaymentRequest, createExpensePaymentRequest, updateExpense } from "../lib/api";
import type { AppUser, Expense, PaymentRequest } from "../lib/types";

interface Props {
  user: AppUser;
  expense: Expense;
  memberProfiles: Record<string, AppUser>;
  paymentRequests: PaymentRequest[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function ExpenseDetailsModal({
  user,
  expense,
  memberProfiles,
  paymentRequests,
  onClose,
  onChanged,
}: Props) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [editingAmount, setEditingAmount] = useState(false);
  const [savingAmount, setSavingAmount] = useState(false);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const canEditAmount = expense.authorId === user.id;
  const isPayer = expense.paidBy === user.id;
  const yourShare = expense.shares.find((share) => share.userId === user.id)?.share || 0;
  const yourPaymentRequest = paymentRequests.find((request) => request.requesterId === user.id);
  const pendingIncomingRequests = paymentRequests.filter((request) => request.status === "pending" && request.approverId === user.id);
  const hasPaymentActivity = paymentRequests.length > 0;

  const splitSummary = useMemo(
    () =>
      expense.shares.map((share) => ({
        ...share,
        name: memberProfiles[share.userId]?.displayName || share.userId,
        status: paymentRequests.find((request) => request.requesterId === share.userId)?.status,
      })),
    [expense.shares, memberProfiles, paymentRequests],
  );

  const handleUpdateAmount = async () => {
    setError("");
    setSavingAmount(true);

    try {
      await updateExpense(expense.id, {
        expense: {
          amount: Number(amount),
        },
      });
      setEditingAmount(false);
      await onChanged();
    } catch (err: any) {
      setError(err.message || "Amount update nahi hua");
    } finally {
      setSavingAmount(false);
    }
  };

  const handleRequestPayment = async () => {
    setError("");
    setRequestingPayment(true);

    try {
      await createExpensePaymentRequest(expense.id);
      await onChanged();
    } catch (err: any) {
      setError(err.message || "Payment request nahi gaya");
    } finally {
      setRequestingPayment(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setError("");
    setApprovingRequestId(requestId);

    try {
      await approveExpensePaymentRequest(requestId);
      await onChanged();
    } catch (err: any) {
      setError(err.message || "Approval nahi hua");
    } finally {
      setApprovingRequestId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{expense.description}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Paid by {memberProfiles[expense.paidBy]?.displayName || expense.paidBy} • {expense.category} • {expense.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:border-slate-900 hover:text-slate-950"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Amount</p>
              {editingAmount ? (
                <div className="mt-4 space-y-3">
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-3xl font-black text-slate-950 outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateAmount}
                      disabled={savingAmount}
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
                    >
                      {savingAmount ? <Loader2 className="animate-spin" size={16} /> : "Save amount"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAmount(false);
                        setAmount(String(expense.amount));
                      }}
                      className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-4xl font-black tracking-tight text-slate-950">{formatMoney(expense.amount)}</p>
                  {canEditAmount && (
                    <button
                      onClick={() => setEditingAmount(true)}
                      disabled={hasPaymentActivity}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil size={16} />
                      Edit amount
                    </button>
                  )}
                </div>
              )}
              {hasPaymentActivity && (
                <p className="mt-2 text-sm font-semibold text-amber-600">Amount locked</p>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Split members</p>
              <div className="mt-4 space-y-3">
                {splitSummary.map((share) => (
                  <div key={share.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                    <div>
                      <p className="text-sm font-black text-slate-950">{share.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {share.userId === expense.paidBy ? "Payer" : share.status === "approved" ? "Approved" : share.status === "pending" ? "Pending approval" : "Unpaid"}
                      </p>
                    </div>
                    <p className="text-lg font-black text-slate-950">{formatMoney(share.share)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {!isPayer && yourShare > 0 && (
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Your share</p>
                <h3 className="mt-3 text-3xl font-black text-slate-950">{formatMoney(yourShare)}</h3>
                {yourPaymentRequest ? (
                  <div className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${yourPaymentRequest.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {yourPaymentRequest.status === "approved" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                    {yourPaymentRequest.status === "approved" ? "Approved by payer" : "Waiting for payer approval"}
                  </div>
                ) : (
                  <button
                    onClick={handleRequestPayment}
                    disabled={requestingPayment}
                    className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
                  >
                    {requestingPayment ? <Loader2 className="animate-spin" size={16} /> : "Mark my share paid"}
                  </button>
                )}
              </div>
            )}

            {isPayer && (
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Incoming approvals</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">Requests for this expense</h3>
                <div className="mt-4 space-y-3">
                  {pendingIncomingRequests.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                      Is expense ke liye abhi koi pending request nahi hai.
                    </div>
                  ) : (
                    pendingIncomingRequests.map((request) => (
                      <div key={request.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-slate-950">
                              {memberProfiles[request.requesterId]?.displayName || request.requesterId}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">Requested {formatMoney(request.amount)} approval</p>
                          </div>
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={approvingRequestId === request.id}
                            className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
                          >
                            {approvingRequestId === request.id ? <Loader2 className="animate-spin" size={14} /> : "Approve"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-600">{error}</div>}
      </motion.div>
    </div>
  );
}
