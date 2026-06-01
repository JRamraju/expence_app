import { useState } from "react";
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

// Wrap MUI Card with Framer Motion for entrance animations
const MotionCard = motion(Card);

export default function LoginPage() {
  const { login, signup, loginGoogle, forgotPassword } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Validation states
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Validate only the fields needed for Email/Password auth
  const validateForm = () => {
    let isValid = true;
    
    if (!email.trim()) {
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (!password) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }

    if (!isValid) {
      toast.warning("Please fill in all mandatory fields.");
    }
    
    return isValid;
  };

  const runAuth = async (action: () => Promise<void>, requiresValidation: boolean = true) => {
    if (requiresValidation && !validateForm()) {
      return; // Stop if validation fails
    }

    try {
      await action();
      toast.success("Authentication successful!");
      navigate("/");
    } catch (e: any) {
      // Firebase throws specific errors, we display them via Toast
      toast.error(e.message || "Authentication failed. Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError(true);
      toast.info("Please enter your email address to reset your password.");
      return;
    }
    try {
      await forgotPassword(email);
      toast.success("Password reset email sent!");
      setEmailError(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send reset email.");
    }
  };

  return (
    <Box minHeight="100vh" display="grid" sx={{ placeItems: "center", bgcolor: "#eef3ff" }}>
      <MotionCard 
        sx={{ width: 420, borderRadius: 3, boxShadow: 4 }}
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={1}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
            Sign in to continue to your dashboard
          </Typography>

          <Stack spacing={2.5}>
            <TextField 
              label="Email Address" 
              variant="outlined"
              required
              error={emailError}
              helperText={emailError ? "Email is required" : ""}
              value={email} 
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(false); // Clear error on typing
              }} 
            />
            
            <TextField 
              type="password" 
              label="Password" 
              variant="outlined"
              required
              error={passwordError}
              helperText={passwordError ? "Password is required" : ""}
              value={password} 
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false); // Clear error on typing
              }} 
            />

            <Box component={motion.div} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button 
                variant="contained" 
                size="large"
                fullWidth
                sx={{ py: 1.2, fontWeight: "bold" }}
                onClick={() => runAuth(() => login(email, password))}
              >
                Sign in
              </Button>
            </Box>

            <Box component={motion.div} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button 
                variant="outlined" 
                size="large"
                fullWidth
                sx={{ py: 1.2, fontWeight: "bold" }}
                onClick={() => runAuth(() => signup(email, password))}
              >
                Create account
              </Button>
            </Box>

            {/* No validation required for Google Auth */}
            <Box component={motion.div} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button 
                variant="text" 
                fullWidth
                sx={{ py: 1.2, fontWeight: "bold", bgcolor: "#f5f5f5" }}
                onClick={() => runAuth(loginGoogle, false)} 
              >
                🚀 Sign in with Google
              </Button>
            </Box>

            <Button 
              size="small" 
              color="secondary"
              sx={{ textTransform: "none" }}
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </Button>
          </Stack>
        </CardContent>
      </MotionCard>
    </Box>
  );
}