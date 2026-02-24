// ============================================
// API Configuration
// Change API_BASE to your backend URL
// ============================================

const API_BASE = "http://localhost:3000/api";

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
  return apiFetch("/login", {
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
  return apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// Slots API calls
// ============================================

export async function apiGetSlots(tenantId?: string) {
  const query = tenantId ? `?tenant_id=${tenantId}` : "";
  return apiFetch(`/slots${query}`);
}

export async function apiCreateSlot(data: {
  slot_number: string;
  floor: string;
  type: string;
}) {
  return apiFetch("/slots", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateSlot(
  slotId: string,
  data: { status?: string; slot_number?: string }
) {
  return apiFetch(`/slots/${slotId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteSlot(slotId: string) {
  return apiFetch(`/slots/${slotId}`, {
    method: "DELETE",
  });
}

// ============================================
// Booking API calls
// ============================================

export async function apiGetBookings() {
  return apiFetch("/bookings");
}

export async function apiCreateBooking(data: {
  slot_id: string;
  vehicle_number: string;
  start_time: string;
  duration: number;
}) {
  return apiFetch("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiCancelBooking(bookingId: string) {
  return apiFetch(`/bookings/${bookingId}`, {
    method: "DELETE",
  });
}

// ============================================
// Payments API calls
// ============================================

export async function apiGetPayments() {
  return apiFetch("/payments");
}

// ============================================
// Admin / Super Admin API calls
// ============================================

export async function apiGetDashboardStats() {
  return apiFetch("/dashboard/stats");
}

export async function apiGetCompanies() {
  return apiFetch("/companies");
}

export async function apiGetUsers() {
  return apiFetch("/users");
}

export { API_BASE };
