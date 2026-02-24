// ============================================
// Slots Management Page (Admin)
// ============================================

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/components/NotificationProvider";
import { Plus, Trash2, Edit2, X } from "lucide-react";

interface Slot {
  id: string;
  slot_number: string;
  floor: string;
  type: string;
  status: "available" | "occupied" | "maintenance";
}

const demoSlots: Slot[] = [
  { id: "1", slot_number: "A-01", floor: "1", type: "Car", status: "available" },
  { id: "2", slot_number: "A-02", floor: "1", type: "Car", status: "occupied" },
  { id: "3", slot_number: "A-03", floor: "1", type: "Car", status: "available" },
  { id: "4", slot_number: "B-01", floor: "2", type: "Bike", status: "available" },
  { id: "5", slot_number: "B-02", floor: "2", type: "Bike", status: "maintenance" },
  { id: "6", slot_number: "C-01", floor: "3", type: "Car", status: "occupied" },
  { id: "7", slot_number: "C-02", floor: "3", type: "Car", status: "available" },
  { id: "8", slot_number: "C-03", floor: "3", type: "SUV", status: "available" },
];

export default function Slots() {
  const [slots, setSlots] = useState<Slot[]>(demoSlots);
  const [showModal, setShowModal] = useState(false);
  const [newSlot, setNewSlot] = useState({ slot_number: "", floor: "", type: "Car" });
  const { showNotification } = useNotification();

  const statusColors: Record<string, string> = {
    available: "bg-accent text-accent-foreground",
    occupied: "bg-destructive/10 text-destructive",
    maintenance: "bg-warning/10 text-warning",
  };

  const addSlot = () => {
    if (!newSlot.slot_number || !newSlot.floor) {
      showNotification("Please fill all fields", "warning");
      return;
    }
    setSlots((prev) => [
      ...prev,
      { id: String(Date.now()), ...newSlot, status: "available" },
    ]);
    setNewSlot({ slot_number: "", floor: "", type: "Car" });
    setShowModal(false);
    showNotification("Slot added successfully", "success");
  };

  const deleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    showNotification("Slot deleted", "info");
  };

  const available = slots.filter((s) => s.status === "available").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;

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
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Slot
          </button>
        </div>

        {/* Slots grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {slots.map((slot) => (
            <div key={slot.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-foreground">{slot.slot_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[slot.status]}`}>
                  {slot.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Floor {slot.floor}</p>
              <p className="text-sm text-muted-foreground mb-3">Type: {slot.type}</p>
              <div className="flex gap-2">
                <button className="flex-1 h-8 rounded-md border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors inline-flex items-center justify-center gap-1">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => deleteSlot(slot.id)}
                  className="h-8 w-8 rounded-md border border-border text-destructive hover:bg-destructive/10 transition-colors inline-flex items-center justify-center"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
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
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Add Slot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
