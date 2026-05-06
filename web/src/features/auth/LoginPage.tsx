import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const { login, signup, loginGoogle, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const run = async (cb: () => Promise<void>) => {
    try {
      await cb();
      navigate("/");
    } catch (e: any) {
      setMsg(e.message || "Authentication failed");
    }
  };

  return (
    <Box minHeight="100vh" display="grid" sx={{ placeItems: "center", bgcolor: "#eef3ff" }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Typography variant="h5" mb={2}>Login</Typography>
          {msg && <Alert severity="error" sx={{ mb: 2 }}>{msg}</Alert>}
          <Stack spacing={1}>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button variant="contained" onClick={() => run(() => login(email, password))}>Sign in</Button>
            <Button variant="outlined" onClick={() => run(() => signup(email, password))}>Create account</Button>
            <Button variant="outlined" onClick={() => run(loginGoogle)}>Sign in with Google</Button>
            <Button size="small" onClick={() => forgotPassword(email)}>Forgot Password</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
