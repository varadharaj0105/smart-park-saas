// ============================================
// API Configuration
// Change API_BASE to your backend URL
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Generic fetch wrapper with auth token
 * Automatically adds Authorization header if token exists
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Parse JSON response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ============================================
// Auth API calls
// ============================================

export async function apiLogin(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSignup(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  company_name?: string;
}) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// Slots API calls
// ============================================

export async function apiGetSlots() {
  return apiFetch("/user/slots");
}

export async function apiGetLocations() {
  return apiFetch("/user/locations");
}

export async function apiCreateSlot(data: {
  slot_number: string;
  floor: string;
  type: string;
}) {
  return apiFetch("/admin/slots", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateSlot(
  slotId: string,
  data: { status?: string; slot_number?: string }
) {
  return apiFetch(`/admin/slots/${slotId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteSlot(slotId: string) {
  return apiFetch(`/admin/slots/${slotId}`, {
    method: "DELETE",
  });
}

// ============================================
// Booking API calls
// ============================================

export async function apiGetBookings() {
  return apiFetch("/user/bookings");
}

export async function apiCreateBooking(data: {
  slot_id: string;
  vehicle_number: string;
  start_time: string;
  duration: number;
}) {
  return apiFetch("/user/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiCancelBooking(bookingId: string) {
  return apiFetch(`/user/bookings/${bookingId}`, {
    method: "DELETE",
  });
}

export async function apiGetUserDashboardStats() {
  return apiFetch("/user/dashboard/stats");
}

// Complete a booking and create payment (exit flow)
export async function apiExitBooking(bookingId: string, method: string = "card") {
  return apiFetch(`/user/bookings/${bookingId}/exit`, {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

// ============================================
// Payments API calls
// ============================================

export async function apiGetPayments() {
  return apiFetch("/user/payments");
}

// ============================================
// Admin / Super Admin API calls
// ============================================

export async function apiGetDashboardStats() {
  return apiFetch("/admin/dashboard/stats");
}

export async function apiGetCompanies() {
  return apiFetch("/super/companies");
}

export async function apiGetCompanyDetails(id: string) {
  return apiFetch(`/super/companies/${id}`);
}

export async function apiCreateCompany(data: {
  company_name: string;
  latitude: number;
  longitude: number;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}) {
  return apiFetch("/super/companies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateCompany(
  id: number,
  data: {
    company_name?: string;
    latitude?: number;
    longitude?: number;
    admin_name?: string;
    admin_email?: string;
    admin_password?: string;
  }
) {
  return apiFetch(`/super/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCompany(id: number) {
  return apiFetch(`/super/companies/${id}`, {
    method: "DELETE",
  });
}

export async function apiGetSuperPayments() {
  return apiFetch("/super/payments");
}

export async function apiGetUsers() {
  return apiFetch("/super/users");
}

export { API_BASE };
