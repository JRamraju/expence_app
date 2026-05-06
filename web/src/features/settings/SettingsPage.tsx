import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "services/firebase";
import { useAuth } from "features/auth/AuthProvider";
import { deleteOldData, retentionFlag, updateProfile } from "features/entries/transactions.api";

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const [profile, setProfile] = useState({ name: "", company: "", monthlyIncome: 0 });
  const [limits, setLimits] = useState({ hand: 50000, sbi: 50000, canara: 50000, blockOverLimit: false });
  const [flag, setFlag] = useState(false);
  const [passwords, setPasswords] = useState({ oldPass: "", newPass: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, f] = await Promise.all([
        getDoc(doc(db, `users/${user.uid}/user_profile/main`)),
        retentionFlag(user.uid)
      ]);
      if (p.exists()) setProfile(p.data() as any);
      setFlag(Boolean((f as any)?.hasOldData));
    })();
  }, [user]);

  const saveLimits = async () => {
    if (!user) return;
    await Promise.all([
      setDoc(doc(db, `users/${user.uid}/accounts/hand`), { limit: limits.hand }, { merge: true }),
      setDoc(doc(db, `users/${user.uid}/accounts/sbi`), { limit: limits.sbi }, { merge: true }),
      setDoc(doc(db, `users/${user.uid}/accounts/canara`), { limit: limits.canara }, { merge: true }),
      setDoc(doc(db, `users/${user.uid}/settings/general`), { blockOverLimit: limits.blockOverLimit }, { merge: true })
    ]);
  };

  return (
    <Stack spacing={2}>
      {flag && <Alert severity="warning">You have data older than 3 months. Do you want to delete it?</Alert>}
      <Card><CardContent><Typography variant="h6">Profile</Typography><Stack spacing={1}><TextField label="Name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /><TextField label="Company" value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} /><TextField type="number" label="Monthly Income" value={profile.monthlyIncome} onChange={(e) => setProfile((p) => ({ ...p, monthlyIncome: Number(e.target.value) }))} /><Button variant="contained" onClick={() => user && updateProfile(user.uid, profile)}>Save Profile</Button></Stack></CardContent></Card>
      <Card><CardContent><Typography variant="h6">Account Limit Control</Typography><Box display="flex" gap={1}><TextField type="number" label="Hand limit" value={limits.hand} onChange={(e) => setLimits((l) => ({ ...l, hand: Number(e.target.value) }))} /><TextField type="number" label="SBI limit" value={limits.sbi} onChange={(e) => setLimits((l) => ({ ...l, sbi: Number(e.target.value) }))} /><TextField type="number" label="Canara limit" value={limits.canara} onChange={(e) => setLimits((l) => ({ ...l, canara: Number(e.target.value) }))} /></Box><Button sx={{ mt: 1 }} variant="contained" onClick={saveLimits}>Save Limits</Button></CardContent></Card>
      <Card><CardContent><Typography variant="h6">Change Password</Typography><Box display="flex" gap={1}><TextField type="password" label="Old" value={passwords.oldPass} onChange={(e) => setPasswords((p) => ({ ...p, oldPass: e.target.value }))} /><TextField type="password" label="New" value={passwords.newPass} onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))} /><Button variant="outlined" onClick={() => changePassword(passwords.oldPass, passwords.newPass)}>Update</Button></Box></CardContent></Card>
      <Card><CardContent><Typography variant="h6">Data Retention</Typography><Button color="error" variant="contained" onClick={() => user && deleteOldData(user.uid)}>Delete Older Than 90 Days</Button></CardContent></Card>
    </Stack>
  );
}
