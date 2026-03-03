// ============================================
// User Dashboard — with Charts
// ============================================

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useNotification } from "@/components/NotificationProvider";
import { CalendarCheck, CreditCard, ParkingSquare, Building2, ArrowRight, Map, Search, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiGetLocations, apiGetUserDashboardStats, apiGetBookings } from "@/lib/api";

export default function DashboardUser() {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBookings: 0, activeBookings: 0, totalSpent: 0 });
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGetLocations().catch(() => ({ data: [] })),
      apiGetUserDashboardStats().catch(() => ({ data: { totalBookings: 0, activeBookings: 0, totalSpent: 0 } })),
      apiGetBookings().catch(() => ({ data: [] }))
    ]).then(([locationsRes, statsRes, bookingsRes]) => {
      setCompanies(locationsRes.data || locationsRes);

      const st = statsRes.data || statsRes;
      setStats({
        totalBookings: st.totalBookings || 0,
        activeBookings: st.activeBookings || 0,
        totalSpent: st.totalSpent || 0
      });

      const ALL_BOOKINGS = bookingsRes.data || bookingsRes;
      if (Array.isArray(ALL_BOOKINGS)) {
        setMyBookings(ALL_BOOKINGS.slice(0, 3));
      }
      setLoading(false);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookSelected = () => {
    if (!selectedCompany) {
      showNotification("Please select a company first", "warning");
      return;
    }
    navigate(`/booking?companyId=${selectedCompany.id}&companyName=${encodeURIComponent(selectedCompany.name)}`);
  };

  // Dummy booking stats for graph for now
  const bookingGraph = [
    { name: "Jan", bookings: 3 }, { name: "Feb", bookings: 5 },
    { name: "Mar", bookings: 2 }, { name: "Apr", bookings: 7 },
    { name: "May", bookings: 4 }, { name: "Jun", bookings: 6 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Bookings" value={stats.totalBookings} icon={CalendarCheck} />
          <StatCard title="Active" value={stats.activeBookings} icon={ParkingSquare} />
          <StatCard title="Total Spent" value={`$${Number(stats.totalSpent).toFixed(2)}`} icon={CreditCard} />
          <StatCard title="Available Locations" value={companies.length} icon={Building2} />
        </div>

        {/* Charts + Peak Hours */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-4">My Booking History</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bookingGraph}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Select company Searchable Dropdown */}
        <div className="bg-card border border-border rounded-lg p-6 overflow-visible">
          <h3 className="font-semibold text-foreground mb-4">Select Company to Book</h3>
          <div className="flex flex-col sm:flex-row gap-3">

            <div className="relative flex-1" ref={dropdownRef}>
              <div
                className="w-full h-10 px-3 rounded-lg border border-input bg-background flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className={`text-sm ${selectedCompany ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {selectedCompany ? selectedCompany.name : "Search and choose a company..."}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </div>

              {dropdownOpen && (
                <div className="absolute top-12 left-0 w-full bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-scale-in">
                  <div className="p-2 border-b border-border flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground ml-1" />
                    <input
                      type="text"
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground p-1"
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto p-1">
                    {filteredCompanies.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">No companies found</div>
                    ) : (
                      filteredCompanies.map(c => (
                        <div
                          key={c.id}
                          className="px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCompany(c);
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          {c.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleBookSelected}
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Slots <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/booking" className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground"><CalendarCheck className="h-5 w-5" /></div>
            <span className="font-medium text-foreground flex-1">Book a Slot</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link to="/map" className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground"><Map className="h-5 w-5" /></div>
            <span className="font-medium text-foreground flex-1">Parking Map</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link to="/payments" className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground"><CreditCard className="h-5 w-5" /></div>
            <span className="font-medium text-foreground flex-1">Payment History</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* My bookings */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">My Recent Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">ID</th>
                  <th className="text-left px-6 py-3 font-medium">Company</th>
                  <th className="text-left px-6 py-3 font-medium">Slot</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                      <CalendarCheck className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      No recent bookings found.
                    </td>
                  </tr>
                ) : (
                  myBookings.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{b.id}</td>
                      <td className="px-6 py-3 text-foreground">{b.company_name || "—"}</td>
                      <td className="px-6 py-3 text-foreground">{b.slot_id}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(b.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.status === "active" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
