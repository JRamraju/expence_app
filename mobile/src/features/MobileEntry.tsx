import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { addDoc, collection } from "firebase/firestore";
import { db, ensureSession } from "src/services/firebase";

export function MobileEntry() {
  const [uid, setUid] = useState<string>("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("General");
  const [account, setAccount] = useState("hand");

  useEffect(() => {
    ensureSession().then((u) => setUid(u.uid));
  }, []);

  const save = async () => {
    if (!uid) return;
    const now = new Date();
    await addDoc(collection(db, `users/${uid}/transactions`), {
      type,
      amount: Number(amount),
      reason,
      category,
      account,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 8),
      createdAt: Date.now()
    });
    setAmount("");
    setReason("");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card><Card.Content>
        <Text variant="titleLarge">Quick Entry</Text>
        <SegmentedButtons value={type} onValueChange={(v) => setType(v as any)} buttons={[{ value: "income", label: "Income" }, { value: "expense", label: "Expense" }]} />
        <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <TextInput label="Reason" value={reason} onChangeText={setReason} />
        <TextInput label="Category" value={category} onChangeText={setCategory} />
        <TextInput label="Account (hand/sbi/canara)" value={account} onChangeText={setAccount} />
        <View style={{ marginTop: 10 }}>
          <Button mode="contained" onPress={save}>Save</Button>
        </View>
      </Card.Content></Card>
    </ScrollView>
  );
}
