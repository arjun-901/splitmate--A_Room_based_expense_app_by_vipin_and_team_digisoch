import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import { Db, MongoClient, ObjectId } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB_NAME || "splitmate";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

const app = express();
app.use(cors());
app.use(express.json());

let db: Db;

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type AuthenticatedRequest = express.Request & {
  user?: AuthUser;
};

type NormalizedShare = {
  userId: string;
  share: number;
};

type NormalizedExpense = {
  amount: number;
  paidBy: string;
  splitBetween: string[];
  splitType: "equal" | "custom";
  shares: NormalizedShare[];
  category: string;
  date: string;
  description: string;
};

type PaymentRequestStatus = "pending" | "approved";

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isValidObjectId(id: string) {
  return ObjectId.isValid(id);
}

function isValidDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function startOfMonth(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function endOfMonth(month: string) {
  const start = startOfMonth(month);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

async function connectDB() {
  const client = await MongoClient.connect(MONGODB_URI);
  db = client.db(DB_NAME);

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("rooms").createIndex({ code: 1 }, { unique: true }),
    db.collection("balances").createIndex({ roomCode: 1, userId: 1 }, { unique: true }),
    db.collection("expenses").createIndex({ roomCode: 1, date: -1 }),
    db.collection("settlements").createIndex({ roomCode: 1, createdAt: -1 }),
    db.collection("paymentRequests").createIndex({ expenseId: 1, requesterId: 1 }, { unique: true }),
    db.collection("paymentRequests").createIndex({ approverId: 1, status: 1, createdAt: -1 }),
  ]);

  console.log("Connected to MongoDB");
}

function signToken(user: AuthUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(userDoc: any): AuthUser {
  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    displayName: userDoc.displayName,
  };
}

const authenticate = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(decoded.id) });

    if (!userDoc) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = sanitizeUser(userDoc);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

async function generateUniqueRoomCode() {
  let code = "";
  let exists = true;

  while (exists) {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
    exists = Boolean(await db.collection("rooms").findOne({ code }));
  }

  return code;
}

async function getRoomForMember(roomCode: string, userId: string) {
  const room = await db.collection("rooms").findOne({ code: roomCode });
  if (!room || !Array.isArray(room.members) || !room.members.includes(userId)) {
    return null;
  }

  return room;
}

function normalizeExpensePayload(
  payload: any,
  roomMembers: string[],
  currentUserId: string,
): NormalizedExpense {
  const amount = Number(payload.amount);
  const description = String(payload.description || "").trim();
  const category = String(payload.category || "General").trim();
  const date = String(payload.date || "").trim();
  const paidBy = String(payload.paidBy || currentUserId);
  const splitType = payload.splitType === "custom" ? "custom" : "equal";
  const rawSplitBetween = Array.isArray(payload.splitBetween) ? payload.splitBetween : [];
  const uniqueMembers = new Set<string>(rawSplitBetween.map((entry: unknown) => String(entry)));
  const splitBetween = Array.from(uniqueMembers);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!description) {
    throw new Error("Description is required");
  }

  if (!category) {
    throw new Error("Category is required");
  }

  if (!isValidDateOnly(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  if (!roomMembers.includes(paidBy)) {
    throw new Error("Payer must be a room member");
  }

  if (splitBetween.length === 0) {
    throw new Error("Select at least one member to split with");
  }

  if (splitBetween.some((memberId) => !roomMembers.includes(memberId))) {
    throw new Error("Split includes an invalid room member");
  }

  let shares: NormalizedShare[] = [];

  if (splitType === "custom") {
    const rawShares = Array.isArray(payload.shares) ? payload.shares : [];
    const map = new Map<string, number>();

    for (const item of rawShares) {
      const userId = String(item?.userId || "");
      const share = roundCurrency(Number(item?.share || 0));
      if (!userId || !splitBetween.includes(userId)) {
        continue;
      }
      map.set(userId, share);
    }

    shares = splitBetween.map((userId) => ({
      userId,
      share: roundCurrency(map.get(userId) || 0),
    }));

    if (shares.some((item) => item.share < 0)) {
      throw new Error("Custom share cannot be negative");
    }

    const totalShare = roundCurrency(shares.reduce((sum, item) => sum + item.share, 0));
    if (Math.abs(totalShare - roundCurrency(amount)) > 0.01) {
      throw new Error("Custom shares must add up to the expense amount");
    }
  } else {
    const memberCount = splitBetween.length;
    const baseShare = roundCurrency(amount / memberCount);
    let consumed = 0;

    shares = splitBetween.map((userId, index) => {
      const share = index === memberCount - 1 ? roundCurrency(amount - consumed) : baseShare;
      consumed = roundCurrency(consumed + share);
      return { userId, share };
    });
  }

  return {
    amount: roundCurrency(amount),
    paidBy,
    splitBetween,
    splitType,
    shares,
    category,
    date,
    description,
  };
}

async function applyExpenseToBalances(roomCode: string, expense: { amount: number; paidBy: string; shares: NormalizedShare[] }, direction: 1 | -1) {
  const payerShare = expense.shares.find((item) => item.userId === expense.paidBy)?.share || 0;
  const payerDelta = roundCurrency((expense.amount - payerShare) * direction);

  await db.collection("balances").updateOne(
    { roomCode, userId: expense.paidBy },
    { $inc: { amount: payerDelta } },
    { upsert: true },
  );

  for (const share of expense.shares) {
    if (share.userId === expense.paidBy) {
      continue;
    }

    await db.collection("balances").updateOne(
      { roomCode, userId: share.userId },
      { $inc: { amount: roundCurrency(-share.share * direction) } },
      { upsert: true },
    );
  }
}

function serializeExpense(expense: any) {
  return {
    ...expense,
    id: expense._id.toString(),
    _id: undefined,
  };
}

function serializeSettlement(settlement: any) {
  return {
    ...settlement,
    id: settlement._id.toString(),
    _id: undefined,
  };
}

function serializePaymentRequest(paymentRequest: any) {
  return {
    ...paymentRequest,
    id: paymentRequest._id.toString(),
    _id: undefined,
  };
}

function getShareForUser(expense: { shares?: NormalizedShare[] }, userId: string) {
  return roundCurrency(expense.shares?.find((item) => item.userId === userId)?.share || 0);
}

app.post("/api/auth/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const displayName = String(req.body?.displayName || "").trim();

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "Display name, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.collection("users").insertOne({
    email,
    passwordHash,
    displayName,
    createdAt: new Date().toISOString(),
  });

  const user = {
    id: result.insertedId.toString(),
    email,
    displayName,
  };

  return res.json({ token: signToken(user), user });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const userDoc = await db.collection("users").findOne({ email });
  if (!userDoc || !(await bcrypt.compare(password, userDoc.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = sanitizeUser(userDoc);
  return res.json({ token: signToken(user), user });
});

app.get("/api/auth/me", authenticate, async (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

app.get("/api/rooms/my-rooms", authenticate, async (req: AuthenticatedRequest, res) => {
  const rooms = await db
    .collection("rooms")
    .find({ members: req.user!.id })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json(
    rooms.map((room) => ({
      code: room.code,
      name: room.name,
      membersCount: room.members.length,
      createdAt: room.createdAt,
    })),
  );
});

app.post("/api/rooms/create", authenticate, async (req: AuthenticatedRequest, res) => {
  const name = String(req.body?.name || "").trim() || "My Split Room";
  const code = await generateUniqueRoomCode();

  await db.collection("rooms").insertOne({
    code,
    name,
    members: [req.user!.id],
    createdBy: req.user!.id,
    createdAt: new Date().toISOString(),
  });

  await db.collection("balances").updateOne(
    { roomCode: code, userId: req.user!.id },
    { $setOnInsert: { amount: 0 } },
    { upsert: true },
  );

  return res.json({ code, roomName: name });
});

app.post("/api/rooms/join", authenticate, async (req: AuthenticatedRequest, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase();

  if (!ROOM_CODE_PATTERN.test(code)) {
    return res.status(400).json({ error: "Enter a valid 6 character room code" });
  }

  const room = await db.collection("rooms").findOne({ code });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (!room.members.includes(req.user!.id)) {
    await db.collection("rooms").updateOne({ code }, { $addToSet: { members: req.user!.id } as any });
    await db.collection("balances").updateOne(
      { roomCode: code, userId: req.user!.id },
      { $setOnInsert: { amount: 0 } },
      { upsert: true },
    );
  }

  return res.json({ code, roomName: room.name });
});

app.get("/api/rooms/:code", authenticate, async (req: AuthenticatedRequest, res) => {
  const roomCode = String(req.params.code || "").trim().toUpperCase();
  const month = req.query.month ? String(req.query.month) : "";
  const room = await getRoomForMember(roomCode, req.user!.id);

  if (!room) {
    return res.status(403).json({ error: "You are not a member of this room" });
  }

  const expenseQuery: Record<string, unknown> = { roomCode };
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "Month must be in YYYY-MM format" });
    }

    expenseQuery.date = {
      $gte: startOfMonth(month).toISOString().slice(0, 10),
      $lt: endOfMonth(month).toISOString().slice(0, 10),
    };
  }

  const [expenses, allExpenses, balances, settlements, paymentRequests, users] = await Promise.all([
    db.collection("expenses").find(expenseQuery).sort({ date: -1, createdAt: -1 }).toArray(),
    db.collection("expenses").find({ roomCode }).toArray(),
    db.collection("balances").find({ roomCode }).toArray(),
    db.collection("settlements").find({ roomCode }).sort({ createdAt: -1 }).toArray(),
    db.collection("paymentRequests").find({ roomCode }).sort({ createdAt: -1 }).toArray(),
    db
      .collection("users")
      .find({ _id: { $in: room.members.filter(isValidObjectId).map((id: string) => new ObjectId(id)) } })
      .toArray(),
  ]);

  const memberProfiles = Object.fromEntries(
    users.map((userDoc) => [userDoc._id.toString(), sanitizeUser(userDoc)]),
  );

  const summary = {
    totalExpense: roundCurrency(allExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)),
    monthlyExpense: roundCurrency(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)),
    yourBalance: roundCurrency(balances.find((balance) => balance.userId === req.user!.id)?.amount || 0),
  };

  return res.json({
    room,
    expenses: expenses.map(serializeExpense),
    balances: balances.map((balance) => ({
      userId: balance.userId,
      amount: roundCurrency(balance.amount || 0),
    })),
    settlements: settlements.map(serializeSettlement),
    paymentRequests: paymentRequests.map(serializePaymentRequest),
    memberProfiles,
    summary,
  });
});

app.delete("/api/rooms/:code/members/:memberId", authenticate, async (req: AuthenticatedRequest, res) => {
  const roomCode = String(req.params.code || "").trim().toUpperCase();
  const memberId = String(req.params.memberId || "").trim();
  const room = await db.collection("rooms").findOne({ code: roomCode });

  if (!room || !Array.isArray(room.members) || !room.members.includes(req.user!.id)) {
    return res.status(403).json({ error: "You are not a member of this room" });
  }

  if (room.createdBy !== req.user!.id) {
    return res.status(403).json({ error: "Only room creator can remove members" });
  }

  if (!room.members.includes(memberId)) {
    return res.status(404).json({ error: "Member not found in this room" });
  }

  if (memberId === room.createdBy) {
    return res.status(400).json({ error: "Room creator cannot remove themselves" });
  }

  await db.collection("rooms").updateOne(
    { code: roomCode },
    { $pull: { members: memberId } as any },
  );

  await db.collection("paymentRequests").deleteMany({
    roomCode,
    $or: [{ requesterId: memberId }, { approverId: memberId }],
  });

  return res.json({ success: true });
});

app.post("/api/expenses", authenticate, async (req: AuthenticatedRequest, res) => {
  const roomCode = String(req.body?.roomCode || "").trim().toUpperCase();
  const room = await getRoomForMember(roomCode, req.user!.id);

  if (!room) {
    return res.status(403).json({ error: "You are not a member of this room" });
  }

  try {
    const normalizedExpense = normalizeExpensePayload(req.body?.expense, room.members, req.user!.id);
    const expenseDocument = {
      ...normalizedExpense,
      roomCode,
      authorId: req.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("expenses").insertOne(expenseDocument);
    await applyExpenseToBalances(roomCode, expenseDocument, 1);

    return res.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Could not save expense" });
  }
});

app.put("/api/expenses/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  const expenseId = String(req.params.id || "");
  if (!isValidObjectId(expenseId)) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  const existingExpense = await db.collection("expenses").findOne({ _id: new ObjectId(expenseId) });
  if (!existingExpense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  if (existingExpense.authorId !== req.user!.id) {
    return res.status(403).json({ error: "You can edit only your own expenses" });
  }

  const room = await getRoomForMember(existingExpense.roomCode, req.user!.id);
  if (!room) {
    return res.status(403).json({ error: "You are not a member of this room" });
  }

  try {
    const amount = Number(req.body?.expense?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    const linkedRequestsCount = await db.collection("paymentRequests").countDocuments({
      expenseId,
      status: { $in: ["pending", "approved"] as PaymentRequestStatus[] },
    });

    if (linkedRequestsCount > 0) {
      return res.status(400).json({ error: "Amount cannot be changed after payment request activity starts" });
    }

    const normalizedExpense = normalizeExpensePayload(
      {
        ...existingExpense,
        amount,
      },
      room.members,
      req.user!.id,
    );
    await applyExpenseToBalances(existingExpense.roomCode, existingExpense as any, -1);

    await db.collection("expenses").updateOne(
      { _id: new ObjectId(expenseId) },
      {
        $set: {
          ...normalizedExpense,
          updatedAt: new Date().toISOString(),
        },
      },
    );

    await applyExpenseToBalances(existingExpense.roomCode, normalizedExpense, 1);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Could not update expense" });
  }
});

app.delete("/api/expenses/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  const expenseId = String(req.params.id || "");
  if (!isValidObjectId(expenseId)) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  const expense = await db.collection("expenses").findOne({ _id: new ObjectId(expenseId) });
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  if (expense.authorId !== req.user!.id) {
    return res.status(403).json({ error: "You can delete only your own expenses" });
  }

  const linkedRequestsCount = await db.collection("paymentRequests").countDocuments({
    expenseId,
    status: { $in: ["pending", "approved"] as PaymentRequestStatus[] },
  });

  if (linkedRequestsCount > 0) {
    return res.status(400).json({ error: "Expense cannot be deleted after payment request activity starts" });
  }

  await applyExpenseToBalances(expense.roomCode, expense as any, -1);
  await db.collection("expenses").deleteOne({ _id: new ObjectId(expenseId) });
  return res.json({ success: true });
});

app.post("/api/expenses/:id/payment-request", authenticate, async (req: AuthenticatedRequest, res) => {
  const expenseId = String(req.params.id || "");
  if (!isValidObjectId(expenseId)) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  const expense = await db.collection("expenses").findOne({ _id: new ObjectId(expenseId) });
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }

  const room = await getRoomForMember(expense.roomCode, req.user!.id);
  if (!room) {
    return res.status(403).json({ error: "You are not a member of this room" });
  }

  if (expense.paidBy === req.user!.id) {
    return res.status(400).json({ error: "Payer cannot raise a payment request for the same expense" });
  }

  if (!expense.splitBetween.includes(req.user!.id)) {
    return res.status(403).json({ error: "You can mark paid only for your own share" });
  }

  const amount = getShareForUser(expense as any, req.user!.id);
  if (amount <= 0) {
    return res.status(400).json({ error: "No payable share found for this user" });
  }

  const existingRequest = await db.collection("paymentRequests").findOne({
    expenseId,
    requesterId: req.user!.id,
  });

  if (existingRequest?.status === "approved") {
    return res.status(400).json({ error: "Your payment for this expense is already approved" });
  }

  if (existingRequest?.status === "pending") {
    return res.status(400).json({ error: "Your payment request is already pending approval" });
  }

  const paymentRequest = {
    expenseId,
    roomCode: expense.roomCode,
    requesterId: req.user!.id,
    approverId: expense.paidBy,
    amount,
    status: "pending" as PaymentRequestStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await db.collection("paymentRequests").insertOne(paymentRequest);
  return res.json({ success: true, id: result.insertedId.toString() });
});

app.put("/api/payment-requests/:id/approve", authenticate, async (req: AuthenticatedRequest, res) => {
  const requestId = String(req.params.id || "");
  if (!isValidObjectId(requestId)) {
    return res.status(400).json({ error: "Invalid payment request id" });
  }

  const paymentRequest = await db.collection("paymentRequests").findOne({ _id: new ObjectId(requestId) });
  if (!paymentRequest) {
    return res.status(404).json({ error: "Payment request not found" });
  }

  if (paymentRequest.approverId !== req.user!.id) {
    return res.status(403).json({ error: "Only the paid by user can approve this request" });
  }

  if (paymentRequest.status === "approved") {
    return res.json({ success: true });
  }

  await db.collection("paymentRequests").updateOne(
    { _id: new ObjectId(requestId) },
    { $set: { status: "approved", updatedAt: new Date().toISOString() } },
  );

  await db.collection("balances").updateOne(
    { roomCode: paymentRequest.roomCode, userId: paymentRequest.requesterId },
    { $inc: { amount: roundCurrency(paymentRequest.amount) } },
    { upsert: true },
  );

  await db.collection("balances").updateOne(
    { roomCode: paymentRequest.roomCode, userId: paymentRequest.approverId },
    { $inc: { amount: roundCurrency(-paymentRequest.amount) } },
    { upsert: true },
  );

  return res.json({ success: true });
});

app.post("/api/settlements", authenticate, async (req: AuthenticatedRequest, res) => {
  const roomCode = String(req.body?.roomCode || "").trim().toUpperCase();
  const from = String(req.body?.from || "");
  const to = String(req.body?.to || "");
  const amount = roundCurrency(Number(req.body?.amount || 0));
  const note = String(req.body?.note || "").trim();

  const room = await getRoomForMember(roomCode, req.user!.id);
  if (!room) {
    return res.status(403).json({ error: "You are not a member of this room" });
  }

  if (!room.members.includes(from) || !room.members.includes(to) || from === to) {
    return res.status(400).json({ error: "Settlement members are invalid" });
  }

  if (req.user!.id !== from && req.user!.id !== to) {
    return res.status(403).json({ error: "Only a settlement participant can log it" });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Settlement amount must be greater than zero" });
  }

  const settlement = {
    roomCode,
    from,
    to,
    amount,
    note,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await db.collection("settlements").insertOne(settlement);
  return res.json({ success: true, id: result.insertedId.toString() });
});

app.put("/api/settlements/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  const settlementId = String(req.params.id || "");
  const status = req.body?.status === "settled" ? "settled" : "pending";

  if (!isValidObjectId(settlementId)) {
    return res.status(400).json({ error: "Invalid settlement id" });
  }

  const settlement = await db.collection("settlements").findOne({ _id: new ObjectId(settlementId) });
  if (!settlement) {
    return res.status(404).json({ error: "Settlement not found" });
  }

  if (req.user!.id !== settlement.from && req.user!.id !== settlement.to) {
    return res.status(403).json({ error: "Only settlement participants can update it" });
  }

  if (settlement.status === status) {
    return res.json({ success: true });
  }

  await db.collection("settlements").updateOne(
    { _id: new ObjectId(settlementId) },
    { $set: { status, updatedAt: new Date().toISOString() } },
  );

  const direction = status === "settled" ? 1 : -1;

  await db.collection("balances").updateOne(
    { roomCode: settlement.roomCode, userId: settlement.from },
    { $inc: { amount: roundCurrency(settlement.amount * direction) } },
    { upsert: true },
  );

  await db.collection("balances").updateOne(
    { roomCode: settlement.roomCode, userId: settlement.to },
    { $inc: { amount: roundCurrency(-settlement.amount * direction) } },
    { upsert: true },
  );

  return res.json({ success: true });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send("SplitMate API is running");
  });
}

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
