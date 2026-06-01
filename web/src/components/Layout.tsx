import { 
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, Avatar, IconButton, Tooltip, Divider, Stack 
} from "@mui/material";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "features/auth/AuthProvider";
import { toast } from "react-toastify";

// Material Icons
import AddBoxIcon from "@mui/icons-material/AddBox";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const nav = [
  { label: "Entry", path: "/", icon: <AddBoxIcon /> },
  { label: "View Entries", path: "/entries", icon: <ReceiptLongIcon /> },
  { label: "Analytics", path: "/analytics", icon: <QueryStatsIcon /> },
  { label: "Settings", path: "/settings", icon: <SettingsIcon /> }
];

const drawerWidth = 260;

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  // Get first letter of email for the Avatar, fallback to 'U'
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f7fe" }}>
      <Drawer 
        variant="permanent" 
        sx={{ 
          width: drawerWidth, 
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxShadow: "4px 0 24px rgba(0,0,0,0.02)", 
            borderRight: "none" 
          } 
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          
          {/* Header */}
          <Toolbar sx={{ my: 1 }}>
            <AccountBalanceWalletIcon color="primary" sx={{ mr: 1.5, fontSize: 32 }} />
            <Typography variant="h6" fontWeight={800} color="primary.main">
              Finance Hub
            </Typography>
          </Toolbar>

          {/* Navigation Links */}
          <List sx={{ px: 2, flexGrow: 1 }}>
            {nav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Box 
                  key={item.path} 
                  component={motion.div} 
                  whileHover={{ scale: 1.02, x: 4 }} 
                  whileTap={{ scale: 0.95 }}
                  sx={{ mb: 1 }}
                >
                  <ListItemButton 
                    component={Link} 
                    to={item.path} 
                    selected={isActive}
                    sx={{
                      borderRadius: 3,
                      color: isActive ? "primary.main" : "text.secondary",
                      bgcolor: isActive ? "primary.50" : "transparent",
                      "&.Mui-selected": {
                        bgcolor: "primary.50",
                        "&:hover": { bgcolor: "primary.100" }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }} 
                    />
                  </ListItemButton>
                </Box>
              );
            })}
          </List>

          {/* User Profile & Logout Box */}
          <Box sx={{ p: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1 }}>
              <Avatar 
                sx={{ 
                  bgcolor: "primary.main", 
                  width: 36, 
                  height: 36, 
                  fontWeight: "bold",
                  fontSize: "1rem" 
                }}
              >
                {userInitial}
              </Avatar>
              <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {user?.email?.split('@')[0] || "User"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
              <Tooltip title="Logout" placement="top">
                <Box component={motion.div} whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }}>
                  <IconButton onClick={handleLogout} color="error" size="small">
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Tooltip>
            </Stack>
          </Box>
          
        </Box>
      </Drawer>

      {/* Main Content Area with Page Transitions */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ height: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}