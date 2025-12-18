import React from "react";
import { useAppContext } from "../../contexts/AppContext";

const EmptyState: React.FC = () => {
  const { i18n } = useAppContext();

  return (
    <div className="gleam-empty-state" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "20px",
      textAlign: "center",
      color: "#999"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
      <p style={{ fontSize: "14px", marginBottom: "8px" }}>
        {i18n?.noMessages || "No messages yet"}
      </p>
      <p style={{ fontSize: "12px", color: "#bbb" }}>
        {i18n?.startChatting || "Start a conversation"}
      </p>
    </div>
  );
};

export default EmptyState;
