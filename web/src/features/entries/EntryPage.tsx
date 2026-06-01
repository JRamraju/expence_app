import { useEffect, useMemo, useState } from "react";
import { 
  Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, 
  Typography, InputAdornment, IconButton, Divider, Switch, FormControlLabel, Grid 
} from "@mui/material";
import { useAuth } from "features/auth/AuthProvider";
import { addTransaction, createCategory, getAccounts, listCategories, seedAccounts } from "./transactions.api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const MotionCard = motion(Card);

export default function EntryPage() {
  const { user } = useAuth();
  
  // Form State
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>(""); // Keep as string for empty input handling
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("General");
  const [account, setAccount] = useState<"hand" | "sbi" | "canara">("hand");
  const [allowOverLimit, setAllowOverLimit] = useState(true);
  
  // Data State
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        await seedAccounts(user.uid);
        setAccounts(await getAccounts(user.uid));
        const c = await listCategories(user.uid);
        if (c.length) setCategories(c);
      } catch (error) {
        toast.error("Failed to load account data.");
      }
    })();
  }, [user]);

  const selectedLimitWarning = useMemo(() => {
    const current = accounts.find((a) => a.name === account);
    if (!current || type !== "expense") return null;
    return Number(amount) > current.limit ? `Limit exceeded for ${account.toUpperCase()} (Max: ${current.limit})` : null;
  }, [accounts, account, amount, type]);

  const validateForm = () => {
    if (!amount || Number(amount) <= 0) {
      toast.warning("Please enter a valid amount greater than 0.");
      return false;
    }
    if (!reason.trim()) {
      toast.warning("Please provide a reason for this transaction.");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!user || !validateForm()) return;
    setIsSubmitting(true);
    
    try {
      await addTransaction(user.uid, { 
        type, 
        amount: Number(amount), 
        reason: reason.trim(), 
        category, 
        account, 
        allowOverLimit 
      });
      setAccounts(await getAccounts(user.uid));
      
      // Reset form
      setAmount("");
      setReason("");
      toast.success("Transaction saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createNewCategory = async () => {
    if (!user || !newCategory.trim()) return;
    
    const catName = newCategory.trim();
    if (categories.includes(catName)) {
      toast.info("Category already exists.");
      return;
    }

    try {
      await createCategory(user.uid, catName);
      setCategories((prev) => [...new Set([...prev, catName])]);
      setCategory(catName);
      setNewCategory("");
      toast.success(`Category "${catName}" added.`);
    } catch (error) {
      toast.error("Failed to create category.");
    }
  };

  return (
    <Box maxWidth="lg" mx="auto">
      <Typography variant="h4" fontWeight={800} mb={3} color="text.primary">
        New Transaction
      </Typography>

      <Grid container spacing={3}>
        {/* Main Form Area */}
        <Grid item xs={12} md={8}>
          <MotionCard 
            sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CardContent sx={{ p: 4 }}>
              
              {/* Type Selection */}
              <Stack direction="row" spacing={2} mb={4}>
                <Button 
                  variant={type === "expense" ? "contained" : "outlined"} 
                  color="error"
                  size="large"
                  fullWidth
                  startIcon={<RemoveCircleOutlineIcon />}
                  onClick={() => setType("expense")}
                  sx={{ py: 1.5, borderRadius: 2 }}
                >
                  Expense
                </Button>
                <Button 
                  variant={type === "income" ? "contained" : "outlined"} 
                  color="success"
                  size="large"
                  fullWidth
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => setType("income")}
                  sx={{ py: 1.5, borderRadius: 2 }}
                >
                  Income
                </Button>
              </Stack>

              <AnimatePresence mode="wait">
                {selectedLimitWarning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>{selectedLimitWarning}</Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Stack spacing={3}>
                <TextField 
                  type="number" 
                  label="Amount" 
                  placeholder="0.00"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon color={type === "expense" ? "error" : "success"} /></InputAdornment>,
                    sx: { fontSize: "1.2rem", fontWeight: "bold" }
                  }}
                />
                
                <TextField 
                  label="Reason / Description" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DescriptionIcon color="action" /></InputAdornment>,
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      select 
                      fullWidth
                      label="Account" 
                      value={account} 
                      onChange={(e) => setAccount(e.target.value as any)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><AccountBalanceWalletIcon color="action" /></InputAdornment>,
                      }}
                    >
                      <MenuItem value="hand">Cash in Hand</MenuItem>
                      <MenuItem value="sbi">SBI Bank</MenuItem>
                      <MenuItem value="canara">Canara Bank</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      select 
                      fullWidth
                      label="Category" 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <FormControlLabel
                    control={<Switch checked={allowOverLimit} onChange={(e) => setAllowOverLimit(e.target.checked)} color="warning" />}
                    label={<Typography variant="body2" color="text.secondary">Allow Over-limit</Typography>}
                  />
                  
                  <Box component={motion.div} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      color="primary"
                      disabled={isSubmitting}
                      onClick={submit}
                      sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: "bold" }}
                    >
                      {isSubmitting ? "Saving..." : "Save Transaction"}
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Sidebar / Extra Tools */}
        <Grid item xs={12} md={4}>
          <MotionCard 
            sx={{ borderRadius: 3, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.100", boxShadow: "none" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} color="primary.main">
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" mb={1} color="text.secondary">
                Add New Category
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField 
                  size="small"
                  fullWidth
                  placeholder="e.g. Groceries" 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && createNewCategory()}
                  sx={{ bgcolor: "white", borderRadius: 1 }}
                />
                <IconButton color="primary" onClick={createNewCategory} sx={{ bgcolor: "white", border: "1px solid", borderColor: "primary.200", borderRadius: 1 }}>
                  <AddIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
}