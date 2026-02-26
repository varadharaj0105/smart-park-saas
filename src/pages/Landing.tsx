// ============================================
// Landing Page
// ============================================

import { Link } from "react-router-dom";
import { Car, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: <Car className="h-6 w-6" />,
    title: "Smart Slot Management",
    desc: "Real-time parking slot tracking with automated availability updates.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Multi-Tenant Security",
    desc: "Each company gets isolated data with role-based access control.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Booking",
    desc: "Users can book available slots in seconds with live status.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Revenue Analytics",
    desc: "Track earnings, bookings, and occupancy with real-time dashboards.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">SmartPark</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 lg:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
          <Zap className="h-3 w-3" /> Multi-Tenant Parking Management
        </div>
        <h1 className="text-4xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          Smart Parking
          <span className="text-primary"> Management</span> for Modern Businesses
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          A complete SaaS ERP to manage parking slots, bookings, and payments across multiple companies — all from one platform.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Start Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center text-accent-foreground mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 SmartPark — Multi-Tenant Parking ERP. Final Year Project.</p>
      </footer>
    </div>
  );
}
