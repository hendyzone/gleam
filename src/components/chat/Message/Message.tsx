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
    >
      <div className="gleam-message-content">
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
    </div>
  );
};

export default React.memo(Message);
