// ============================================
// Slots Management Page (Admin)
// ============================================

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/components/NotificationProvider";
import { Plus, Trash2, Edit2, X, MapPin, Car } from "lucide-react";
import { apiCreateSlot, apiDeleteSlot, apiGetSlots, apiUpdateSlot } from "@/lib/api";

interface Slot {
  id: number;
  slot_number: string;
  floor: string;
  type: string;
  status: "available" | "occupied" | "maintenance";
}

export default function Slots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editSlotData, setEditSlotData] = useState<Slot | null>(null);
  const [newSlot, setNewSlot] = useState({ slot_number: "", floor: "", type: "Car" });
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const statusColors: Record<string, string> = {
    available: "bg-accent text-accent-foreground",
    occupied: "bg-destructive/10 text-destructive",
    maintenance: "bg-warning/10 text-warning",
  };

  const loadSlots = async () => {
    try {
      const result = await apiGetSlots();
      // Backend returns { success, data: [...] }
      setSlots(result.data || result);
    } catch (error: any) {
      showNotification(error.message || "Failed to load slots", "error");
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const addSlot = async () => {
    if (!newSlot.slot_number || !newSlot.floor) {
      showNotification("Please fill all fields", "warning");
      return;
    }
    try {
      setLoading(true);
      await apiCreateSlot(newSlot);
      showNotification("Slot added successfully", "success");
      setNewSlot({ slot_number: "", floor: "", type: "Car" });
      setShowModal(false);
      await loadSlots();
    } catch (error: any) {
      showNotification(error.message || "Failed to add slot", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (id: number) => {
    try {
      setLoading(true);
      await apiDeleteSlot(String(id));
      showNotification("Slot deleted", "info");
      await loadSlots();
    } catch (error: any) {
      showNotification(error.message || "Failed to delete slot", "error");
    } finally {
      setLoading(false);
    }
  };

  const available = slots.filter((s) => s.status === "available").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;

  const updateSlot = async () => {
    if (!editSlotData || !editSlotData.slot_number) {
      showNotification("Please provide a slot number", "warning");
      return;
    }
    try {
      setLoading(true);
      await apiUpdateSlot(String(editSlotData.id), {
        slot_number: editSlotData.slot_number,
        status: editSlotData.status,
      });
      showNotification("Slot updated successfully", "success");
      setEditSlotData(null);
      await loadSlots();
    } catch (error: any) {
      showNotification(error.message || "Failed to update slot", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Parking Slots</h3>
            <p className="text-sm text-muted-foreground">
              {slots.length} total · {available} available · {occupied} occupied
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </button>
          </div>
        </div>

        {/* Floor Map Slots View */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground mb-4">Available Slots</h3>

          {slots.length === 0 ? (
            <div className="text-center p-12 bg-card border border-border rounded-lg text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
              No parking bays configured yet. Click "Add New Slot" to begin building your map.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {slots.map((slot) => {
                const isAvailable = slot.status === "available";

                let slotStyle = "bg-muted border-border/50 opacity-60 cursor-not-allowed";
                let iconStyle = "text-muted-foreground";

                if (isAvailable) {
                  slotStyle = "bg-card border-border hover:border-indigo-200 cursor-pointer text-foreground";
                  iconStyle = "text-indigo-600";
                } else if (!isAvailable && slot.status === 'occupied') {
                  slotStyle = "bg-slate-50 border-slate-200 cursor-not-allowed opacity-70";
                  iconStyle = "text-slate-400";
                }

                return (
                  <div
                    key={slot.id}
                    onClick={() => setEditSlotData(slot)}
                    title="Click to Edit"
                    className={`rounded-xl border p-4 flex flex-col gap-2 min-h-[90px] ${slotStyle}`}
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

        {slots.length === 0 && (
          <div className="text-center p-12 bg-card border border-border rounded-lg text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
            No parking bays configured yet. Click "Add New Slot" to begin building your map.
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-lg">Add New Slot</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Slot Number</label>
                <input
                  value={newSlot.slot_number}
                  onChange={(e) => setNewSlot({ ...newSlot, slot_number: e.target.value })}
                  placeholder="e.g. A-01"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Floor</label>
                <input
                  value={newSlot.floor}
                  onChange={(e) => setNewSlot({ ...newSlot, floor: e.target.value })}
                  placeholder="e.g. 1"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Type</label>
                <select
                  value={newSlot.type}
                  onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Car</option>
                  <option>Bike</option>
                  <option>SUV</option>
                  <option>Truck</option>
                </select>
              </div>
              <button
                onClick={addSlot}
                disabled={loading}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                {loading ? "Saving..." : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editSlotData && (
        <div className="fixed inset-0 bg-foreground/20 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-lg">Edit Slot</h3>
              <button onClick={() => setEditSlotData(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Slot Number</label>
                <input
                  value={editSlotData.slot_number}
                  onChange={(e) => setEditSlotData({ ...editSlotData, slot_number: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <select
                  value={editSlotData.status}
                  onChange={(e) => setEditSlotData({ ...editSlotData, status: e.target.value as Slot["status"] })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <button
                onClick={updateSlot}
                disabled={loading}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                {loading ? "Saving..." : "Update Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
