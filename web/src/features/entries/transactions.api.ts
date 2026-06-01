import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "services/firebase";
import { ACCOUNTS } from "@expense/shared/src";

// REFINED: Use a Batch to execute all account creations in a single network request
export async function seedAccounts(uid: string) {
  const batch = writeBatch(db);
  for (const acc of ACCOUNTS) {
    const ref = doc(db, `users/${uid}/accounts/${acc}`);
    batch.set(
      ref,
      { name: acc, balance: 0, limit: 50000, updatedAt: Date.now() },
      { merge: true }
    );
  }
  await batch.commit();
}

export async function getAccounts(uid: string) {
  const list = await getDocs(collection(db, `users/${uid}/accounts`));
  return list.docs.map((d) => d.data());
}

export async function createCategory(uid: string, name: string) {
  await setDoc(doc(db, `users/${uid}/categories/${name.toLowerCase()}`), { name }, { merge: true });
}

export async function listCategories(uid: string) {
  const list = await getDocs(collection(db, `users/${uid}/categories`));
  return list.docs.map((d) => d.data().name as string);
}

export async function addTransaction(uid: string, payload: {
  type: "income" | "expense";
  amount: number;
  reason: string;
  category: string;
  account: "hand" | "sbi" | "canara";
  allowOverLimit?: boolean;
}) {
  const userRef = doc(db, `users/${uid}`);
  const accountRef = doc(db, `users/${uid}/accounts/${payload.account}`);
  const txRef = doc(collection(db, `users/${uid}/transactions`));
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);
  const summaryRef = doc(db, `users/${uid}/daily_summary/${date}`);

  await runTransaction(db, async (trx) => {
    // ==========================================
    // 1. ALL READS FIRST
    // ==========================================
    const accountSnap = await trx.get(accountRef);
    const summarySnap = await trx.get(summaryRef); // CRITICAL FIX: Moved this read up

    if (!accountSnap.exists()) {
      throw new Error("Selected account not found");
    }

    // ==========================================
    // 2. CALCULATIONS & VALIDATIONS
    // ==========================================
    const accountData = accountSnap.data() as { balance: number; limit: number };
    const currentBalance = Number(accountData.balance || 0);
    const limit = Number(accountData.limit || 0);

    if (payload.type === "expense" && payload.amount > limit && payload.allowOverLimit === false) {
      throw new Error("Limit exceeded for this account");
    }

    const nextBalance =
      payload.type === "income" ? currentBalance + payload.amount : currentBalance - payload.amount;
    const displayIdPrefix = payload.type === "income" ? "in" : "ex";

    const existing = summarySnap.exists()
      ? (summarySnap.data() as {
          total_income: number;
          total_expense: number;
          transactions: string[];
        })
      : { total_income: 0, total_expense: 0, transactions: [] };

    const totalIncome = existing.total_income + (payload.type === "income" ? payload.amount : 0);
    const totalExpense = existing.total_expense + (payload.type === "expense" ? payload.amount : 0);

    // ==========================================
    // 3. ALL WRITES LAST
    // ==========================================
    trx.set(
      txRef,
      {
        id: `${displayIdPrefix}-${Date.now()}`,
        type: payload.type,
        amount: payload.amount,
        reason: payload.reason,
        category: payload.category,
        account: payload.account,
        date,
        time,
        createdAt: Date.now()
      },
      { merge: true }
    );

    trx.set(
      accountRef,
      {
        balance: nextBalance,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    trx.set(
      summaryRef,
      {
        id: date,
        total_income: totalIncome,
        total_expense: totalExpense,
        savings: totalIncome - totalExpense,
        transactions: [...(existing.transactions || []), txRef.id],
        updatedAt: Date.now()
      },
      { merge: true }
    );

    trx.set(userRef, { updatedAt: Date.now() }, { merge: true });
  });
}

export async function listTransactions(uid: string) {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
}

export async function retentionFlag(uid: string) {
  const threshold = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const oldQuery = query(
    collection(db, `users/${uid}/transactions`),
    where("createdAt", "<=", threshold)
  );
  const snap = await getDocs(oldQuery);
  return { hasOldData: !snap.empty, threshold };
}

// REFINED: Better querying and respects the 500 batch limit
export async function deleteOldData(uid: string) {
  const threshold = Date.now() - 90 * 24 * 60 * 60 * 1000;
  
  const oldTxSnap = await getDocs(
    query(collection(db, `users/${uid}/transactions`), where("createdAt", "<=", threshold))
  );

  // Instead of fetching all summaries, we only fetch the old ones
  const oldSummarySnap = await getDocs(
    query(collection(db, `users/${uid}/daily_summary`), where("updatedAt", "<=", threshold))
  );

  const batch = writeBatch(db);
  let opCount = 0;

  oldTxSnap.forEach((item) => {
    if (opCount < 498) { // Firestore batch limit is 500
      batch.delete(item.ref);
      opCount++;
    }
  });

  oldSummarySnap.forEach((item) => {
    if (opCount < 498) {
      batch.delete(item.ref);
      opCount++;
    }
  });

  if (opCount > 0) {
    await batch.commit();
  }
}

export async function updateProfile(uid: string, data: { name: string; company: string; monthlyIncome: number }) {
  await setDoc(doc(db, `users/${uid}/user_profile/main`), data, { merge: true });
}

export async function addNotification(uid: string, message: string) {
  await addDoc(collection(db, `users/${uid}/notifications`), { message, createdAt: Date.now() });
}