import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useAuth } from "features/auth/AuthProvider";
import { addTransaction, createCategory, getAccounts, listCategories, seedAccounts } from "./transactions.api";

export default function EntryPage() {
  const { user } = useAuth();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("General");
  const [newCategory, setNewCategory] = useState("");
  const [account, setAccount] = useState<"hand" | "sbi" | "canara">("hand");
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [allowOverLimit, setAllowOverLimit] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await seedAccounts(user.uid);
      setAccounts(await getAccounts(user.uid));
      const c = await listCategories(user.uid);
      if (c.length) setCategories(c);
    })();
  }, [user]);

  const selectedLimitWarning = useMemo(() => {
    const current = accounts.find((a) => a.name === account);
    if (!current || type !== "expense") return null;
    return amount > current.limit ? `Limit exceeded for ${account.toUpperCase()}` : null;
  }, [accounts, account, amount, type]);

  const submit = async () => {
    if (!user) return;
    await addTransaction(user.uid, { type, amount, reason, category, account, allowOverLimit });
    setAccounts(await getAccounts(user.uid));
    setAmount(0);
    setReason("");
  };

  const createNewCategory = async () => {
    if (!user || !newCategory.trim()) return;
    await createCategory(user.uid, newCategory.trim());
    setCategories((prev) => [...new Set([...prev, newCategory.trim()])]);
    setCategory(newCategory.trim());
    setNewCategory("");
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" mb={2}>Entry</Typography>
        <Stack spacing={2}>
          <ToggleButtonGroup exclusive value={type} onChange={(_, val) => val && setType(val)}>
            <ToggleButton value="income">Income</ToggleButton>
            <ToggleButton value="expense">Expense</ToggleButton>
          </ToggleButtonGroup>
          {selectedLimitWarning && <Alert severity="warning">{selectedLimitWarning}</Alert>}
          <TextField type="number" label="Amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Box display="flex" gap={1}>
            <TextField label="Create category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <Button variant="outlined" onClick={createNewCategory}>Add</Button>
          </Box>
          <TextField select label="Account" value={account} onChange={(e) => setAccount(e.target.value as any)}>
            <MenuItem value="hand">Hand</MenuItem>
            <MenuItem value="sbi">SBI</MenuItem>
            <MenuItem value="canara">Canara</MenuItem>
          </TextField>
          <Box display="flex" gap={1}>
            <Button variant={allowOverLimit ? "contained" : "outlined"} onClick={() => setAllowOverLimit((p) => !p)}>
              {allowOverLimit ? "Over-limit allowed" : "Over-limit blocked"}
            </Button>
            <Button variant="contained" onClick={submit}>Save Transaction</Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
