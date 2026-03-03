// ============================================
// Booking Page
// ============================================

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/components/NotificationProvider";
import { CalendarCheck, Car, MapPin } from "lucide-react";
import { apiCreateBooking, apiGetSlots } from "@/lib/api";
import { useSearchParams, Link } from "react-router-dom";

interface AvailableSlot {
  id: number;
  slot_number: string;
  floor: string;
  type: string;
  status: "available" | "occupied" | "maintenance" | string;
  company_name?: string;
  tenant_id?: number;
}

export default function Booking() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [duration, setDuration] = useState("1");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const filterCompanyId = searchParams.get("companyId");
  const filterCompanyName = searchParams.get("companyName");

  const loadSlots = async () => {
    try {
      const result = await apiGetSlots();
      const allSlots: AvailableSlot[] = result.data || result;

      if (filterCompanyId) {
        setSlots(allSlots.filter(s => String(s.tenant_id) === filterCompanyId));
      } else {
        setSlots(allSlots);
      }
    } catch (error: any) {
      showNotification(error.message || "Failed to load slots", "error");
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleBook = async () => {
    if (!selectedSlot || !vehicle) {
      showNotification("Please select a slot and enter vehicle number", "warning");
      return;
    }
    setLoading(true);
    try {
      const slotId = selectedSlot;
      const startTime = new Date().toISOString().slice(0, 19).replace("T", " ");
      await apiCreateBooking({
        slot_id: String(slotId),
        vehicle_number: vehicle,
        start_time: startTime,
        duration: Number(duration),
      });
      showNotification("Booking confirmed!", "success");
      setSelectedSlot(null);
      setVehicle("");
      setDuration("1");
      loadSlots();
    } catch (error: any) {
      showNotification(error.message || "Failed to create booking", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {filterCompanyName ? `Book a Parking Slot at ${filterCompanyName}` : "Select a Location"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filterCompanyName ? "Select an available slot and enter your vehicle details" : "You must select a parking area from the map first."}
          </p>
        </div>

        {!filterCompanyId ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center max-w-2xl mx-auto">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">No Location Selected</h4>
            <p className="text-muted-foreground mb-6">Please navigate to the Parking Map to select an area before booking a slot.</p>
            <Link to="/map" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Go to Parking Map
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available slots */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-bold text-foreground mb-4">Available Slots</h3>

              {slots.length === 0 ? (
                <div className="text-center p-12 bg-card border border-border rounded-lg text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  No parking bays configured for this location yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {slots.map((slot) => {
                    const isAvailable = slot.status === "available";
                    const isSelected = selectedSlot === slot.id;

                    let slotStyle = "bg-muted border-border/50 opacity-60 cursor-not-allowed";
                    let iconStyle = "text-muted-foreground";

                    if (isAvailable && !isSelected) {
                      slotStyle = "bg-card border-border hover:border-indigo-200 cursor-pointer text-foreground";
                      iconStyle = "text-indigo-600";
                    } else if (isSelected) {
                      slotStyle = "bg-indigo-50 border-indigo-600 border-2 cursor-pointer shadow-sm";
                      iconStyle = "text-indigo-600";
                    } else if (!isAvailable && slot.status === 'occupied') {
                      slotStyle = "bg-slate-50 border-slate-200 cursor-not-allowed opacity-70";
                      iconStyle = "text-slate-400";
                    }

                    return (
                      <div
                        key={slot.id}
                        onClick={() => isAvailable && setSelectedSlot(slot.id)}
                        className={`rounded-xl p-4 flex flex-col gap-2 min-h-[90px] ${!isSelected ? 'border' : ''} ${slotStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <Car className={`h-5 w-5 ${iconStyle}`} />
                          <span className="font-bold text-lg text-slate-900">
                            {slot.slot_number}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          Floor {slot.floor} &middot; {slot.type}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    value={slots.find((s) => s.id === selectedSlot)?.slot_number || "None selected"}
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
        )}
      </div>
    </DashboardLayout>
  );
}
