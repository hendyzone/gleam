import React, { useCallback } from "react";
import ControlBar from "./ControlBar/ControlBar";
import MessageList from "./MessageList";
import InputArea from "./InputArea/InputArea";
import { useMessageRegenerate } from "../../hooks/business/useMessageRegenerate";

const ChatContainer: React.FC = () => {
  const { regenerateMessage } = useMessageRegenerate();

  const handleRegenerate = useCallback(async (messageId: string) => {
    await regenerateMessage(messageId);
  }, [regenerateMessage]);

  return (
    <div
      className="gleam-chat-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <ControlBar />
      <MessageList onRegenerate={handleRegenerate} />
      <InputArea />
    </div>
  );
};

export default ChatContainer;
