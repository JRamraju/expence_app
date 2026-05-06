import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();
const db = admin.firestore();

type TxType = "income" | "expense";
type AccountName = "hand" | "sbi" | "canara";

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export const createTransaction = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");

  const {
    type,
    amount,
    reason,
    category,
    account,
    allowOverLimit = true
  } = request.data as {
    type: TxType;
    amount: number;
    reason: string;
    category: string;
    account: AccountName;
    allowOverLimit?: boolean;
  };

  if (!["income", "expense"].includes(type) || amount <= 0 || !reason || !category) {
    throw new HttpsError("invalid-argument", "Invalid transaction payload");
  }

  const userRef = db.collection("users").doc(uid);
  const accountRef = userRef.collection("accounts").doc(account);
  const txRef = userRef.collection("transactions").doc();
  const summaryRef = userRef.collection("daily_summary").doc(dateKey());

  await db.runTransaction(async (trx) => {
    const accountSnap = await trx.get(accountRef);
    if (!accountSnap.exists) {
      throw new HttpsError("not-found", "Account does not exist");
    }

    const accountData = accountSnap.data() as { balance: number; limit: number };
    const delta = type === "income" ? amount : -amount;
    const nextBalance = (accountData.balance || 0) + delta;

    if (type === "expense" && Math.abs(delta) + Math.max(0, -nextBalance) > (accountData.limit || 0) && !allowOverLimit) {
      throw new HttpsError("failed-precondition", "Limit exceeded for this account");
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8);

    trx.update(accountRef, { balance: nextBalance, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    trx.set(txRef, {
      id: txRef.id,
      type,
      amount,
      reason,
      category,
      account,
      date,
      time,
      createdAt: Date.now()
    });

    const summarySnap = await trx.get(summaryRef);
    const existing = summarySnap.exists
      ? (summarySnap.data() as { total_income: number; total_expense: number; transactions: string[] })
      : { total_income: 0, total_expense: 0, transactions: [] };

    const totalIncome = existing.total_income + (type === "income" ? amount : 0);
    const totalExpense = existing.total_expense + (type === "expense" ? amount : 0);

    trx.set(
      summaryRef,
      {
        id: date,
        total_income: totalIncome,
        total_expense: totalExpense,
        savings: totalIncome - totalExpense,
        transactions: admin.firestore.FieldValue.arrayUnion(txRef.id),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  return { ok: true, id: txRef.id };
});

export const dailyRetentionFlagger = onSchedule("every day 01:00", async (_event) => {
  const now = Date.now();
  const threshold = now - 90 * 24 * 60 * 60 * 1000;
  const users = await db.collection("users").get();

  for (const userDoc of users.docs) {
    const oldTx = await userDoc.ref
      .collection("transactions")
      .where("createdAt", "<=", threshold)
      .limit(1)
      .get();

    await userDoc.ref.collection("retention_flags").doc("old_data").set({
      hasOldData: !oldTx.empty,
      threshold,
      checkedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return;
});

export const deleteOldData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");

  const olderThanDays = Number(request.data?.olderThanDays ?? 90);
  const threshold = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  const userRef = db.collection("users").doc(uid);
  const oldTx = await userRef.collection("transactions").where("createdAt", "<=", threshold).get();

  const batch = db.batch();
  oldTx.docs.forEach((d) => batch.delete(d.ref));

  const oldSummaries = await userRef.collection("daily_summary").get();
  oldSummaries.docs.forEach((d) => {
    if (new Date(d.id).getTime() <= threshold) batch.delete(d.ref);
  });

  batch.set(userRef.collection("retention_flags").doc("old_data"), {
    hasOldData: false,
    deletedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  return { ok: true, deletedTransactions: oldTx.size };
});
