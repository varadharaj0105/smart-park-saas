import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardUser from "./pages/DashboardUser";
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import Slots from "./pages/Slots";
import Booking from "./pages/Booking";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import BookingHistory from "./pages/BookingHistory";
import ParkingMap from "./pages/ParkingMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard/admin" element={<DashboardAdmin />} />
              <Route path="/dashboard/user" element={<DashboardUser />} />
              <Route path="/dashboard/superadmin" element={<DashboardSuperAdmin />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/booking-history" element={<BookingHistory />} />
              <Route path="/map" element={<ParkingMap />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
