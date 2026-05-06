import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { format, isAfter, parseISO, subDays } from "date-fns";
import { useAuth } from "features/auth/AuthProvider";
import { getAccounts, listTransactions } from "./transactions.api";

export default function ViewEntriesPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setAccounts(await getAccounts(user.uid));
      setItems(await listTransactions(user.uid));
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const now = new Date();
    return items.filter((t) => {
      const d = parseISO(`${t.date}T${t.time}`);
      if (filter === "today") return format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
      if (filter === "yesterday") return format(d, "yyyy-MM-dd") === format(subDays(now, 1), "yyyy-MM-dd");
      if (filter === "last7") return isAfter(d, subDays(now, 7));
      if (filter === "custom" && from && to) return d >= new Date(from) && d <= new Date(`${to}T23:59:59`);
      return true;
    });
  }, [items, filter, from, to]);

  return (
    <Stack spacing={2}>
      <Box display="flex" gap={2}>
        {accounts.map((a) => (
          <Card key={a.name} sx={{ minWidth: 180 }}><CardContent><Typography>{a.name.toUpperCase()}</Typography><Typography variant="h6">₹ {a.balance}</Typography></CardContent></Card>
        ))}
      </Box>
      <Card>
        <CardContent>
          <Box display="flex" gap={1} mb={2}>
            <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last7">Last 7 days</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </TextField>
            {filter === "custom" && (
              <>
                <TextField type="date" size="small" value={from} onChange={(e) => setFrom(e.target.value)} />
                <TextField type="date" size="small" value={to} onChange={(e) => setTo(e.target.value)} />
              </>
            )}
          </Box>
          <Stack spacing={1}>
            {filtered.map((t) => (
              <Card key={t._id} variant="outlined">
                <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography fontWeight={600}>{t.reason}</Typography>
                    <Typography variant="body2">{t.date} {t.time} | {t.account.toUpperCase()} | {t.category}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip color={t.type === "income" ? "success" : "error"} label={`${t.type} ₹${t.amount}`} />
                    <Button size="small" variant="outlined">Edit (Re-auth)</Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
