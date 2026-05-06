import { Box, Drawer, List, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";

const nav = [
  { label: "Entry", path: "/" },
  { label: "View Entries", path: "/entries" },
  { label: "Analytics", path: "/analytics" },
  { label: "Settings", path: "/settings" }
];

export default function Layout() {
  const location = useLocation();
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f9ff" }}>
      <Drawer variant="permanent" sx={{ width: 260, [`& .MuiDrawer-paper`]: { width: 260, p: 2 } }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700}>Finance Hub</Typography>
        </Toolbar>
        <List>
          {nav.map((item) => (
            <ListItemButton key={item.path} component={Link} to={item.path} selected={location.pathname === item.path}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
