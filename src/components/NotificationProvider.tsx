// ============================================
// Floating Notification Component
// Usage: showNotification("Message", "success")
// ============================================

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  leaving?: boolean;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

let notifId = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const id = ++notifId;
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leaving: true } : n))
      );
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leaving: true } : n))
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 300);
  };

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-primary" />,
  };

  const borderMap = {
    success: "border-l-4 border-l-success",
    error: "border-l-4 border-l-destructive",
    warning: "border-l-4 border-l-warning",
    info: "border-l-4 border-l-primary",
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Notification container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto bg-card text-card-foreground rounded-lg shadow-lg p-4 flex items-start gap-3 ${borderMap[n.type]} ${n.leaving ? "animate-slide-out" : "animate-slide-in"}`}
          >
            <div className="mt-0.5">{iconMap[n.type]}</div>
            <p className="flex-1 text-sm font-medium">{n.message}</p>
            <button
              onClick={() => dismiss(n.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
