import React from "react";
import { useAppContext } from "../../../contexts/AppContext";
import { useUIContext } from "../../../contexts/UIContext";
import { copyToClipboard } from "../../../utils/clipboard";

interface MessageActionsProps {
  messageId: string;
  content: string;
  role: "user" | "assistant";
  onRegenerate?: (messageId: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  content,
  role,
  onRegenerate,
}) => {
  const { i18n } = useAppContext();
  const { dispatch: uiDispatch } = useUIContext();

  const handleCopy = async () => {
    const success = await copyToClipboard(content);
    if (success) {
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: i18n?.copySuccess || "Copied to clipboard"
        }
      });
    } else {
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: i18n?.copyFailed || "Failed to copy"
        }
      });
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(messageId);
    }
  };

  return (
    <div
      className="gleam-message-actions"
      style={{
        display: "flex",
        gap: "4px",
        marginTop: "8px",
        opacity: 0.7,
      }}
    >
      <button
        className="b3-button b3-button--small"
        onClick={handleCopy}
        title={i18n?.copy || "Copy"}
        style={{ padding: "2px 8px", fontSize: "12px" }}
      >
        📋 {i18n?.copy || "Copy"}
      </button>
      {role === "assistant" && onRegenerate && (
        <button
          className="b3-button b3-button--small"
          onClick={handleRegenerate}
          title={i18n?.regenerate || "Regenerate"}
          style={{ padding: "2px 8px", fontSize: "12px" }}
        >
          🔄 {i18n?.regenerate || "Regenerate"}
        </button>
      )}
    </div>
  );
};

export default MessageActions;
