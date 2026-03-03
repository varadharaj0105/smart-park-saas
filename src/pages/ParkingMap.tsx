// ============================================
// Parking Map Page — Visual Slot Selection
// Uses Leaflet.js for interactive map
// ============================================

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/components/NotificationProvider";
import { MapPin, Car, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import { apiGetLocations, apiCreateCompany } from "@/lib/api";
import { getAuth } from "@/lib/auth";

export interface ParkingLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  total_slots: number;
  available_slots: number;
}

function MapComponent({
  locations,
  onSelectLocation,
  onMapClick
}: {
  locations: ParkingLocation[];
  onSelectLocation: (loc: ParkingLocation) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      const existing = document.getElementById("parking-map");
      if (!existing) return;

      // Clean up previous map
      if ((existing as any)._leaflet_id) {
        (existing as any)._leaflet_id = null;
        existing.innerHTML = "";
      }

      const map = L.map("parking-map").setView([28.6139, 77.209], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Custom marker icon
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:hsl(234,80%,60%);color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">P</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Update map bounds if there are locations
      if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }

      locations.forEach((loc) => {
        const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:150px;">
            <strong>${loc.name}</strong><br/>
            <span style="color:#666;">Total: ${loc.total_slots} | Available: ${loc.available_slots}</span><br/>
          </div>`
        );
        marker.on("click", () => onSelectLocation(loc));
      });

      map.on("click", (e: any) => {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        }
      });

      setMapReady(true);

      return () => {
        map.remove();
      };
    });
  }, [locations]);

  return (
    <div
      id="parking-map"
      className="w-full h-[400px] rounded-lg border border-border overflow-hidden"
      style={{ background: "hsl(var(--muted))" }}
    />
  );
}

export default function ParkingMap() {
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const user = getAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLocation, setNewLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', admin_name: '', admin_email: '', admin_password: ''
  });

  const fetchLocations = async () => {
    try {
      const res = await apiGetLocations();
      setLocations(res.data || []);
    } catch (error: any) {
      showNotification(error.message || "Failed to fetch locations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSelectLocation = (loc: ParkingLocation) => {
    setSelectedLocation(loc);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (user?.role === 'superadmin') {
      setNewLocation({ lat, lng });
      setShowCreateModal(true);
      setFormData({ company_name: '', admin_name: '', admin_email: '', admin_password: '' });
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation) return;

    setIsSubmitting(true);
    try {
      await apiCreateCompany({
        ...formData,
        latitude: newLocation.lat,
        longitude: newLocation.lng
      });
      showNotification("Company created successfully!", "success");
      setShowCreateModal(false);
      fetchLocations();
    } catch (error: any) {
      showNotification(error.message || "Failed to create company", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading parking map...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-foreground">Parking Map</h3>
          <p className="text-sm text-muted-foreground">
            {user?.role === 'superadmin'
              ? "Click anywhere on the map to create a new company location"
              : "Select a company location to view available slots"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 relative">
            <MapComponent
              locations={locations}
              onSelectLocation={handleSelectLocation}
              onMapClick={handleMapClick}
            />
          </div>

          {/* Location details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Parking Locations</h4>
            {locations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No locations available.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-sm ${selectedLocation?.id === loc.id
                      ? "border-primary bg-accent ring-2 ring-ring"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">{loc.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{loc.total_slots} total slots</span>
                      <span className={`text-xs font-medium ${loc.available_slots > 10 ? "text-success" : loc.available_slots > 0 ? "text-warning" : "text-destructive"}`}>
                        {loc.available_slots} available
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedLocation && (
              <Link
                to={`/booking?companyId=${selectedLocation.id}&companyName=${encodeURIComponent(selectedLocation.name)}`}
                className="w-full h-10 mt-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                <Car className="h-4 w-4" /> Book in {selectedLocation.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Super Admin Create Company Modal */}
      {showCreateModal && user?.role === 'superadmin' && (
        <div className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl animate-scale-in">
            <h3 className="text-xl font-bold text-foreground mb-4">Create New Company</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Setting up at coordinates {newLocation?.lat.toFixed(4)}, {newLocation?.lng.toFixed(4)}
            </p>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Acme Parking"
                />
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3">Admin Account Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Admin Name</label>
                    <input
                      type="text"
                      required
                      className="w-full h-9 px-3 rounded-md border border-border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Admin Email</label>
                    <input
                      type="email"
                      required
                      className="w-full h-9 px-3 rounded-md border border-border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      placeholder="admin@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Admin Password</label>
                    <input
                      type="password"
                      required
                      className="w-full h-9 px-3 rounded-md border border-border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.admin_password}
                      onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Company & Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
