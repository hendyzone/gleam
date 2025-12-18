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
    <div className="gleam-message-actions">
      <button
        className="gleam-copy-button"
        onClick={handleCopy}
        title={i18n?.copy || "Copy"}
      >
        📋
      </button>
      {role === "assistant" && onRegenerate && (
        <button
          className="gleam-regenerate-button"
          onClick={handleRegenerate}
          title={i18n?.regenerate || "Regenerate"}
        >
          🔄
        </button>
      )}
    </div>
  );
};

export default MessageActions;
