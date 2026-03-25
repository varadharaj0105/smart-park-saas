import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import Companies from "./pages/Companies";
import CompanyDetails from "./pages/CompanyDetails";
import Users from "./pages/Users";
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

              {/* Super Admin Routes */}
              <Route path="/dashboard/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardSuperAdmin /></ProtectedRoute>} />
              <Route path="/companies" element={<ProtectedRoute allowedRoles={["superadmin"]}><Companies /></ProtectedRoute>} />
              <Route path="/companies/:id" element={<ProtectedRoute allowedRoles={["superadmin"]}><CompanyDetails /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={["superadmin"]}><Users /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardAdmin /></ProtectedRoute>} />
              <Route path="/slots" element={<ProtectedRoute allowedRoles={["admin"]}><Slots /></ProtectedRoute>} />

              {/* User Routes */}
              <Route path="/dashboard/user" element={<ProtectedRoute allowedRoles={["user"]}><DashboardUser /></ProtectedRoute>} />
              <Route path="/booking" element={<ProtectedRoute allowedRoles={["user"]}><Booking /></ProtectedRoute>} />

              {/* Shared Protected Routes */}
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/booking-history" element={<ProtectedRoute allowedRoles={["admin", "user"]}><BookingHistory /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><ParkingMap /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
