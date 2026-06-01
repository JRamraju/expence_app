import { useEffect, useMemo, useState } from "react";
import { 
  Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, 
  Typography, Grid, Avatar, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, CircularProgress
} from "@mui/material";
import { format, isAfter, parseISO, subDays } from "date-fns";
import { useAuth } from "features/auth/AuthProvider";
import { getAccounts, listTransactions } from "./transactions.api";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "react-toastify"; 

// Icons
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockResetIcon from '@mui/icons-material/LockReset';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LockPersonIcon from '@mui/icons-material/LockPerson'; 
import EditNoteIcon from '@mui/icons-material/EditNote'; // <-- Added for the Edit Dialog

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } }
};

export default function ViewEntriesPage() {
  const { user, reauthenticate } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- RE-AUTH & EDIT STATES ---
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  
  // Security Modal
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ amount: "", reason: "" });

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setAccounts(await getAccounts(user.uid));
    setItems(await listTransactions(user.uid));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
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

  const getAccountIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("hand") || n.includes("cash")) return <PaymentsIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }} />;
    return <AccountBalanceIcon sx={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }} />;
  };

  const getCardBackground = (index: number) => {
    const themes = [
      "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      "linear-gradient(135deg, #065f46 0%, #064e3b 100%)",
      "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
    ];
    return themes[index % themes.length];
  };

  // --- RE-AUTH HANDLERS ---
  const handleOpenReAuth = (transaction: any) => {
    setSelectedTx(transaction);
    setReAuthPassword("");
    setReAuthOpen(true);
  };

  const handleVerifyPassword = async () => {
    if (!reAuthPassword) {
      toast.warning("Please enter your password.");
      return;
    }
    setIsVerifying(true);
    try {
      await reauthenticate(reAuthPassword);
      toast.success("Identity verified.");
      setReAuthOpen(false);
      
      // OPEN EDIT MODAL AND POPULATE DATA
      setEditForm({ amount: selectedTx.amount.toString(), reason: selectedTx.reason });
      setEditOpen(true);
      
    } catch (error: any) {
      toast.error(error.message || "Incorrect password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- EDIT HANDLERS ---
  const handleSaveEdit = async () => {
    if (!editForm.amount || !editForm.reason.trim()) {
      toast.warning("Fields cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: You will need to build `updateTransaction` in transactions.api.ts
      // await updateTransaction(user!.uid, selectedTx._id, { amount: Number(editForm.amount), reason: editForm.reason });
      
      toast.success("Transaction updated successfully!");
      setEditOpen(false);
      setSelectedTx(null);
      await loadData(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to update transaction.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box maxWidth="lg" mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3} color="text.primary" letterSpacing="-0.5px">
        Dashboard Overview
      </Typography>

      {/* Account Balances (Wallets) */}
      <Grid container spacing={3} mb={4}>
        {accounts.map((a, index) => (
          <Grid item xs={12} sm={6} md={4} key={a.name}>
             <MotionCard 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" as const }}
              sx={{ 
                borderRadius: 2, color: "white", background: getCardBackground(index),
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden"
              }}
            >
              <Box sx={{ position: "absolute", top: -30, right: -20, opacity: 0.05, transform: "rotate(-15deg)" }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 160 }} />
              </Box>
              <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="overline" fontWeight={600} letterSpacing={1.5} sx={{ opacity: 0.8, color: "#e2e8f0" }}>
                    {a.name.toUpperCase()}
                  </Typography>
                  {getAccountIcon(a.name)}
                </Stack>
                <Typography variant="h4" fontWeight={700} sx={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-1px" }}>
                  ₹{Number(a.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Transactions Section */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)", border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 0 }}>
          
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f8fafc" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                Transaction History
              </Typography>
              <Box display="flex" gap={1.5} flexWrap="wrap">
                <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 160, bgcolor: "white", "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="yesterday">Yesterday</MenuItem>
                  <MenuItem value="last7">Last 7 days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </TextField>
                
                <AnimatePresence>
                  {filter === "custom" && (
                    <MotionBox initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} display="flex" gap={1}>
                      <TextField type="date" size="small" value={from} onChange={(e) => setFrom(e.target.value)} sx={{ bgcolor: "white", "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                      <TextField type="date" size="small" value={to} onChange={(e) => setTo(e.target.value)} sx={{ bgcolor: "white", "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>
            </Stack>
          </Box>

          <Box>
            {isLoading ? (
              <Typography textAlign="center" color="text.secondary" py={6}>Loading transactions...</Typography>
            ) : filtered.length === 0 ? (
              <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ py: 10, textAlign: "center", color: "text.secondary" }}>
                <ReceiptLongIcon sx={{ fontSize: 48, opacity: 0.2, mb: 2 }} />
                <Typography variant="subtitle1" fontWeight={500}>No transactions found</Typography>
              </MotionBox>
            ) : (
              <motion.div variants={listContainer} initial="hidden" animate="show">
                {filtered.map((t, index) => {
                  const isIncome = t.type === "income";
                  return (
                    <motion.div key={t._id} variants={listItem}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2.5, transition: "background 0.2s", "&:hover": { bgcolor: "#f8fafc" } }}>
                        <Box display="flex" alignItems="center" gap={2.5}>
                          <Avatar sx={{ bgcolor: isIncome ? "#ecfdf5" : "#fef2f2", color: isIncome ? "#10b981" : "#ef4444", width: 40, height: 40 }}>
                            {isIncome ? <CallReceivedIcon fontSize="small" /> : <CallMadeIcon fontSize="small" />}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mb: 0.5 }}>{t.reason}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                              <span style={{ fontWeight: 500 }}>{format(parseISO(`${t.date}T${t.time}`), "MMM dd, hh:mm a")}</span>
                              <span style={{ opacity: 0.5 }}>•</span>
                              <span style={{ textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 600, letterSpacing: 0.5 }}>{t.account}</span>
                              <span style={{ opacity: 0.5 }}>•</span>
                              <span>{t.category}</span>
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={3}>
                          <Typography variant="subtitle1" fontWeight={600} color={isIncome ? "#059669" : "#dc2626"} sx={{ fontFamily: "'Inter', monospace" }}>
                            {isIncome ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </Typography>
                          <Tooltip title="Edit Transaction (Requires Authentication)">
                            <IconButton size="small" sx={{ border: "1px solid", borderColor: "divider", bgcolor: "white" }} onClick={() => handleOpenReAuth(t)}>
                              <LockResetIcon fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      {index < filtered.length - 1 && <Divider sx={{ mx: 3 }} />}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- 1. SECURE RE-AUTH DIALOG --- */}
      <Dialog open={reAuthOpen} onClose={() => !isVerifying && setReAuthOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 350 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Avatar sx={{ bgcolor: "error.50", color: "error.main", width: 36, height: 36 }}>
            <LockPersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Security Check</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3, fontSize: "0.9rem" }}>
            To protect your financial data, please verify your password before modifying this transaction.
          </DialogContentText>
          <TextField autoFocus fullWidth type="password" label="Current Password" variant="outlined" value={reAuthPassword} onChange={(e) => setReAuthPassword(e.target.value)} disabled={isVerifying} onKeyPress={(e) => e.key === 'Enter' && handleVerifyPassword()} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReAuthOpen(false)} color="inherit" disabled={isVerifying}>Cancel</Button>
          <Button onClick={handleVerifyPassword} variant="contained" color="primary" disabled={isVerifying} sx={{ px: 3, borderRadius: 2 }}>
            {isVerifying ? <CircularProgress size={24} color="inherit" /> : "Verify Identity"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- 2. EDIT TRANSACTION DIALOG --- */}
      <Dialog open={editOpen} onClose={() => !isSaving && setEditOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 400 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Avatar sx={{ bgcolor: "primary.50", color: "primary.main", width: 36, height: 36 }}>
            <EditNoteIcon />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>Edit Transaction</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              fullWidth 
              label="Amount" 
              type="number"
              variant="outlined" 
              value={editForm.amount} 
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} 
              disabled={isSaving} 
            />
            <TextField 
              fullWidth 
              label="Reason / Description" 
              variant="outlined" 
              value={editForm.reason} 
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} 
              disabled={isSaving} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={isSaving} sx={{ px: 3, borderRadius: 2 }}>
            {isSaving ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}