import type { AppUser, DashboardData, ExpenseShare, RoomSummary } from "./types";

const TOKEN_KEY = "splitmate_token";
const ROOM_KEY = "splitmate_room";

type AuthResponse = {
  token: string;
  user: AppUser;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data as T;
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROOM_KEY);
}

export function storeRoom(code: string) {
  localStorage.setItem(ROOM_KEY, code.toUpperCase());
}

export function getStoredRoom() {
  return localStorage.getItem(ROOM_KEY);
}

export function clearStoredRoom() {
  localStorage.removeItem(ROOM_KEY);
}

export async function register(payload: {
  displayName: string;
  email: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: {
  email: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return apiFetch<{ user: AppUser }>("/api/auth/me");
}

export async function createRoom(name: string) {
  return apiFetch<{ code: string; roomName: string }>("/api/rooms/create", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function joinRoom(code: string) {
  return apiFetch<{ code: string; roomName: string }>("/api/rooms/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function getMyRooms() {
  return apiFetch<RoomSummary[]>("/api/rooms/my-rooms");
}

export async function getDashboard(roomCode: string, month?: string) {
  const search = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiFetch<DashboardData>(`/api/rooms/${roomCode}${search}`);
}

export async function addExpense(payload: {
  roomCode: string;
  expense: {
    amount: number;
    splitBetween: string[];
    splitType: "equal" | "custom";
    shares?: ExpenseShare[];
    category: string;
    date: string;
    description: string;
    paidBy: string;
  };
}) {
  return apiFetch<{ success: true; id: string }>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(
  id: string,
  payload: {
    expense: {
      amount: number;
    };
  },
) {
  return apiFetch<{ success: true }>(`/api/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: string) {
  return apiFetch<{ success: true }>(`/api/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function createSettlement(payload: {
  roomCode: string;
  from: string;
  to: string;
  amount: number;
  note?: string;
}) {
  return apiFetch<{ success: true; id: string }>("/api/settlements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSettlementStatus(id: string, status: "pending" | "settled") {
  return apiFetch<{ success: true }>(`/api/settlements/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function createExpensePaymentRequest(expenseId: string) {
  return apiFetch<{ success: true; id: string }>(`/api/expenses/${expenseId}/payment-request`, {
    method: "POST",
  });
}

export async function approveExpensePaymentRequest(requestId: string) {
  return apiFetch<{ success: true }>(`/api/payment-requests/${requestId}/approve`, {
    method: "PUT",
  });
}

export async function removeRoomMember(roomCode: string, memberId: string) {
  return apiFetch<{ success: true }>(`/api/rooms/${roomCode}/members/${memberId}`, {
    method: "DELETE",
  });
}
