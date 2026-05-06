import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { listTransactions } from "features/entries/transactions.api";
import { useAuth } from "features/auth/AuthProvider";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    listTransactions(user.uid).then(setData);
  }, [user]);

  const filtered = useMemo(() => data.filter((d) => (accountFilter === "all" || d.account === accountFilter) && (categoryFilter === "all" || d.category === categoryFilter)), [data, accountFilter, categoryFilter]);

  const trend = useMemo(() => {
    const map: Record<string, { day: string; income: number; expense: number }> = {};
    filtered.forEach((t) => {
      map[t.date] ||= { day: t.date, income: 0, expense: 0 };
      if (t.type === "income") map[t.date].income += t.amount;
      else map[t.date].expense += t.amount;
    });
    return Object.values(map);
  }, [filtered]);

  const accountUsage = ["hand", "sbi", "canara"].map((acc) => ({ name: acc, value: filtered.filter((t) => t.account === acc).reduce((s, t) => s + t.amount, 0) }));
  const categoryBreakdown = Object.values(filtered.reduce((m: any, t) => {
    m[t.category] ||= { category: t.category, amount: 0 };
    m[t.category].amount += t.amount;
    return m;
  }, {}));

  const insight = useMemo(() => {
    const highestDay = trend.sort((a, b) => b.expense - a.expense)[0];
    const mostUsed = accountUsage.sort((a, b) => b.value - a.value)[0];
    const totalExpense = filtered.filter((f) => f.type === "expense").reduce((s, i) => s + i.amount, 0);
    const avg = filtered.length ? totalExpense / Math.max(1, trend.length) : 0;
    return { highestDay: highestDay?.day, mostUsed: mostUsed?.name, avg };
  }, [trend, accountUsage, filtered]);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Monthly Finance Report", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Date", "Type", "Amount", "Reason", "Account", "Category"]],
      body: filtered.map((i) => [i.date, i.type, i.amount, i.reason, i.account, i.category])
    });
    doc.save("monthly-report.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtered);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  return (
    <Stack spacing={2}>
      <Box display="flex" gap={1}>
        <TextField select size="small" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
          <MenuItem value="all">All Accounts</MenuItem><MenuItem value="hand">Hand</MenuItem><MenuItem value="sbi">SBI</MenuItem><MenuItem value="canara">Canara</MenuItem>
        </TextField>
        <TextField size="small" label="Category filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value || "all")} />
        <Button variant="outlined" onClick={exportPdf}>Download PDF</Button>
        <Button variant="outlined" onClick={exportExcel}>Export Excel</Button>
      </Box>
      <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={2}>
        <Card><CardContent><Typography>Income vs Expense Trend</Typography><ResponsiveContainer width="100%" height={220}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line type="monotone" dataKey="income" stroke="#2e7d32" /><Line type="monotone" dataKey="expense" stroke="#d32f2f" /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardContent><Typography>Account Usage</Typography><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={accountUsage} dataKey="value" nameKey="name" outerRadius={80}>{accountUsage.map((_, i) => <Cell key={i} fill={["#1976d2", "#9c27b0", "#ff9800"][i % 3]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
        <Card><CardContent><Typography>Category Breakdown</Typography><ResponsiveContainer width="100%" height={220}><BarChart data={categoryBreakdown}><XAxis dataKey="category" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#1976d2" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardContent><Typography>Cash Flow</Typography><ResponsiveContainer width="100%" height={220}><AreaChart data={trend}><XAxis dataKey="day" /><YAxis /><Tooltip /><Area dataKey="income" stackId="1" stroke="#2e7d32" fill="#81c784" /><Area dataKey="expense" stackId="2" stroke="#d32f2f" fill="#ef9a9a" /></AreaChart></ResponsiveContainer></CardContent></Card>
      </Box>
      <Card><CardContent><Typography variant="h6">Smart Insights</Typography><Typography>Highest spending day: {insight.highestDay || "-"}</Typography><Typography>Most used account: {insight.mostUsed || "-"}</Typography><Typography>Average daily expense: ₹ {insight.avg.toFixed(2)}</Typography></CardContent></Card>
    </Stack>
  );
}
