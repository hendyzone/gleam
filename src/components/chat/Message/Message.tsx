import React from "react";
import { ChatMessage } from "../../../utils/types";
import { useChatContext } from "../../../contexts/ChatContext";
import MessageContent from "./MessageContent";
import MessageImage from "./MessageImage";
import MessageAudio from "./MessageAudio";
import MessageActions from "./MessageActions";

interface MessageProps {
  message: ChatMessage;
  onRegenerate?: (messageId: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, onRegenerate }) => {
  const { state } = useChatContext();
  const isStreaming = state.streamingMessageId === message.id;

  return (
    <div
      className={`gleam-message gleam-message-${message.role}`}
      data-message-id={message.id}
      style={{
        marginBottom: "16px",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: message.role === "user" ? "#e3f2fd" : "#f5f5f5",
      }}
    >
      {/* Role indicator */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          marginBottom: "8px",
          color: message.role === "user" ? "#1976d2" : "#666",
        }}
      >
        {message.role === "user" ? "You" : "Assistant"}
        {isStreaming && (
          <span style={{ marginLeft: "8px", fontSize: "10px", color: "#999" }}>
            ⚡ Streaming...
          </span>
        )}
      </div>

      {/* Message content */}
      <MessageContent content={message.content} isStreaming={isStreaming} />

      {/* Images */}
      {message.images && message.images.length > 0 && (
        <div className="gleam-message-images">
          {message.images.map((imageUrl, index) => (
            <MessageImage key={index} imageUrl={imageUrl} />
          ))}
        </div>
      )}

      {/* Audio */}
      {message.audio && message.audio.length > 0 && (
        <div className="gleam-message-audios">
          {message.audio.map((audioData, index) => (
            <MessageAudio key={index} audioData={audioData} />
          ))}
        </div>
      )}

      {/* Actions (don't show while streaming) */}
      {!isStreaming && (
        <MessageActions
          messageId={message.id}
          content={message.content}
          role={message.role}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
};

export default React.memo(Message);
