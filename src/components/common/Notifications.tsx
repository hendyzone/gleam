import React, { useEffect, useCallback } from "react";
import { useUIContext } from "../../contexts/UIContext";
import "./Notifications.scss";

const Notifications: React.FC = () => {
  const { state: uiState, dispatch: uiDispatch } = useUIContext();

  useEffect(() => {
    if (uiState.notifications.length === 0) return;

    // 为每个通知设置自动移除定时器
    const timers: NodeJS.Timeout[] = [];

    uiState.notifications.forEach((notification) => {
      const duration = notification.type === "error" ? 5000 : notification.type === "success" ? 3000 : 4000;

      const timer = setTimeout(() => {
        uiDispatch({ type: "REMOVE_NOTIFICATION", payload: notification.id });
      }, duration);

      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [uiState.notifications, uiDispatch]);

  const handleClose = useCallback((id: string) => {
    uiDispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, [uiDispatch]);

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "ⓘ";
      default:
        return "ⓘ";
    }
  }, []);

  if (uiState.notifications.length === 0) {
    return null;
  }

  return (
    <div className="gleam-notifications">
      {uiState.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`gleam-notification gleam-notification-${notification.type}`}
        >
          <div className="gleam-notification-icon">{getIcon(notification.type)}</div>
          <div className="gleam-notification-message">{notification.message}</div>
          <button
            className="gleam-notification-close"
            onClick={() => handleClose(notification.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
