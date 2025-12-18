import React, { useMemo, useRef, useEffect } from "react";
import { MarkdownRenderer } from "../../../ui/utils/markdown";

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isStreaming = false }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // For streaming messages, directly update DOM to avoid flicker
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.innerHTML = MarkdownRenderer.renderMarkdown(content);
    }
  }, [content, isStreaming]);

  // For completed messages, use React's dangerouslySetInnerHTML
  const html = useMemo(() => {
    if (!isStreaming) {
      return MarkdownRenderer.renderMarkdown(content);
    }
    return "";
  }, [content, isStreaming]);

  if (isStreaming) {
    return <div ref={contentRef} className="gleam-message-content" />;
  }

  return (
    <div
      className="gleam-message-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MessageContent;
