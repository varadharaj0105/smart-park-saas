// ============================================
// Stat Card Component
// Used across all dashboards
// ============================================

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down";
  trendValue?: string;
}

export default function StatCard({ title, value, icon: Icon, description, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && trendValue && (
          <p className={`text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </p>
        )}
      </div>
    </div>
  );
}
