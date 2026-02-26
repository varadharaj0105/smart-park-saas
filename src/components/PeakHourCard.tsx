// ============================================
// AI-Style Peak Hour Prediction Card
// Simple calculation based on demo booking data
// ============================================

import { Brain, TrendingUp, TrendingDown, Clock } from "lucide-react";

// Simple peak hour prediction logic
function predictPeakHours() {
  // Simulated hourly booking counts (based on typical patterns)
  const hourlyData = [
    { hour: 6, count: 5 }, { hour: 7, count: 12 }, { hour: 8, count: 28 },
    { hour: 9, count: 35 }, { hour: 10, count: 18 }, { hour: 11, count: 15 },
    { hour: 12, count: 22 }, { hour: 13, count: 14 }, { hour: 14, count: 16 },
    { hour: 15, count: 20 }, { hour: 16, count: 25 }, { hour: 17, count: 38 },
    { hour: 18, count: 42 }, { hour: 19, count: 36 }, { hour: 20, count: 24 },
    { hour: 21, count: 10 }, { hour: 22, count: 5 },
  ];

  const avg = hourlyData.reduce((s, d) => s + d.count, 0) / hourlyData.length;
  const peak = hourlyData.filter((d) => d.count > avg * 1.3);
  const low = hourlyData.filter((d) => d.count < avg * 0.7);

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}${ampm}`;
  };

  const peakRange = peak.length
    ? `${formatHour(peak[0].hour)} - ${formatHour(peak[peak.length - 1].hour + 1)}`
    : "N/A";
  const lowRange = low.length
    ? `${formatHour(low[0].hour)} - ${formatHour(low[low.length - 1].hour + 1)}`
    : "N/A";

  const occupancyRate = Math.round((peak.reduce((s, d) => s + d.count, 0) / peak.length / 50) * 100);

  return { peakRange, lowRange, occupancyRate, avgBookings: Math.round(avg) };
}

export default function PeakHourCard() {
  const prediction = predictPeakHours();

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <Brain className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">AI Parking Prediction</h4>
          <p className="text-xs text-muted-foreground">Based on booking patterns</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
          <TrendingUp className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Peak Hours</p>
            <p className="text-xs text-muted-foreground">{prediction.peakRange} — ~{prediction.occupancyRate}% occupancy</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
          <TrendingDown className="h-5 w-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Low Traffic</p>
            <p className="text-xs text-muted-foreground">{prediction.lowRange} — Best time to park</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Avg. Bookings/Hour</p>
            <p className="text-xs text-muted-foreground">{prediction.avgBookings} bookings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
