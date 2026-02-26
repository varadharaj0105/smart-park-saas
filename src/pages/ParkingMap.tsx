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

// Parking zones with coordinates
const parkingZones = [
  { id: "Z1", name: "Zone A — Ground Floor", lat: 28.6139, lng: 77.209, slots: 40, available: 12, type: "Car" },
  { id: "Z2", name: "Zone B — Floor 1", lat: 28.6145, lng: 77.2105, slots: 30, available: 8, type: "Bike" },
  { id: "Z3", name: "Zone C — Floor 2", lat: 28.6132, lng: 77.2075, slots: 50, available: 23, type: "Car" },
  { id: "Z4", name: "Zone D — Basement", lat: 28.615, lng: 77.208, slots: 20, available: 5, type: "SUV" },
];

function MapComponent({ onSelectZone }: { onSelectZone: (zone: typeof parkingZones[0]) => void }) {
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

      parkingZones.forEach((zone) => {
        const marker = L.marker([zone.lat, zone.lng], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:150px;">
            <strong>${zone.name}</strong><br/>
            <span style="color:#666;">Total: ${zone.slots} | Available: ${zone.available}</span><br/>
            <span style="color:#666;">Type: ${zone.type}</span>
          </div>`
        );
        marker.on("click", () => onSelectZone(zone));
      });

      setMapReady(true);

      return () => {
        map.remove();
      };
    });
  }, []);

  return (
    <div
      id="parking-map"
      className="w-full h-[400px] rounded-lg border border-border overflow-hidden"
      style={{ background: "hsl(var(--muted))" }}
    />
  );
}

export default function ParkingMap() {
  const [selectedZone, setSelectedZone] = useState<typeof parkingZones[0] | null>(null);
  const { showNotification } = useNotification();

  const handleSelectZone = (zone: typeof parkingZones[0]) => {
    setSelectedZone(zone);
    showNotification(`Selected ${zone.name}`, "info");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-foreground">Parking Map</h3>
          <p className="text-sm text-muted-foreground">Click on a zone to view available slots</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <MapComponent onSelectZone={handleSelectZone} />
          </div>

          {/* Zone details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Parking Zones</h4>
            {parkingZones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => handleSelectZone(zone)}
                className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-sm ${
                  selectedZone?.id === zone.id
                    ? "border-primary bg-accent ring-2 ring-ring"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">{zone.name}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{zone.type} · {zone.slots} slots</span>
                  <span className={`text-xs font-medium ${zone.available > 10 ? "text-success" : zone.available > 0 ? "text-warning" : "text-destructive"}`}>
                    {zone.available} available
                  </span>
                </div>
              </button>
            ))}

            {selectedZone && (
              <Link
                to="/booking"
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                <Car className="h-4 w-4" /> Book in {selectedZone.name.split("—")[0]}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
