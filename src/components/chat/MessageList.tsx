import React, { useRef, useEffect } from "react";
import { useChatContext } from "../../contexts/ChatContext";
import Message from "./Message/Message";
import EmptyState from "../common/EmptyState";

interface MessageListProps {
  onRegenerate?: (messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ onRegenerate }) => {
  const { state } = useChatContext();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [state.messages, state.streamingMessageId]);

  if (state.messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      ref={containerRef}
      className="gleam-message-list"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
      }}
    >
      {state.messages.map((message) => (
        <Message key={message.id} message={message} onRegenerate={onRegenerate} />
      ))}
    </div>
  );
};

export default MessageList;
