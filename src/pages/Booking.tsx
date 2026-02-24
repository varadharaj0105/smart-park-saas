// ============================================
// Booking Page
// ============================================

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/components/NotificationProvider";
import { CalendarCheck, Car } from "lucide-react";

interface AvailableSlot {
  id: string;
  slot_number: string;
  floor: string;
  type: string;
}

const demoAvailable: AvailableSlot[] = [
  { id: "1", slot_number: "A-01", floor: "1", type: "Car" },
  { id: "3", slot_number: "A-03", floor: "1", type: "Car" },
  { id: "4", slot_number: "B-01", floor: "2", type: "Bike" },
  { id: "7", slot_number: "C-02", floor: "3", type: "Car" },
  { id: "8", slot_number: "C-03", floor: "3", type: "SUV" },
];

export default function Booking() {
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [vehicle, setVehicle] = useState("");
  const [duration, setDuration] = useState("1");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleBook = async () => {
    if (!selectedSlot || !vehicle) {
      showNotification("Please select a slot and enter vehicle number", "warning");
      return;
    }
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      showNotification("Booking confirmed!", "success");
      setSelectedSlot("");
      setVehicle("");
      setDuration("1");
      setLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Book a Parking Slot</h3>
          <p className="text-sm text-muted-foreground">Select an available slot and enter your vehicle details</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Available slots */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-4">Available Slots</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {demoAvailable.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedSlot === slot.id
                        ? "border-primary bg-accent ring-2 ring-ring"
                        : "border-border hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-4 w-4 text-primary" />
                      <span className="font-bold text-foreground">{slot.slot_number}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Floor {slot.floor} · {slot.type}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Booking form */}
          <div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 sticky top-20">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Booking Details</h4>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Selected Slot</label>
                <input
                  readOnly
                  value={demoAvailable.find((s) => s.id === selectedSlot)?.slot_number || "None selected"}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Vehicle Number</label>
                <input
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="e.g. ABC-1234"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Duration (hours)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 12, 24].map((h) => (
                    <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="font-semibold text-foreground">${Number(duration) * 5}.00</span>
                </div>
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
