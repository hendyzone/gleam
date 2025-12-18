import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../../../contexts/AppContext";
import { useAttachment } from "../../../hooks/business/useAttachment";
import { useMessageSend } from "../../../hooks/business/useMessageSend";
import AttachmentPreview from "./AttachmentPreview";

const InputArea: React.FC = () => {
  const { i18n } = useAppContext();
  const { handleFileSelect, handlePaste } = useAttachment();
  const { sendMessage, isLoading } = useMessageSend();
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste event for images
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const onPaste = (e: ClipboardEvent) => {
      handlePaste(e);
    };

    textarea.addEventListener("paste", onPaste as any);
    return () => {
      textarea.removeEventListener("paste", onPaste as any);
    };
  }, [handlePaste]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    await sendMessage(content);
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so the same file can be selected again
    e.target.value = "";
  }, [handleFileSelect]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, []);

  return (
    <div
      className="gleam-input-area"
      style={{
        borderTop: "1px solid #e0e0e0",
        background: "#fff",
      }}
    >
      <AttachmentPreview />

      <div style={{ display: "flex", padding: "12px", gap: "8px" }}>
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Attachment button */}
        <button
          className="b3-button b3-button--outline"
          onClick={handleFileButtonClick}
          disabled={isLoading}
          title={i18n?.addAttachment || "Add attachment"}
          style={{ padding: "4px 12px", flexShrink: 0 }}
        >
          📎
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="b3-text-field"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={i18n?.inputPlaceholder || "Type a message..."}
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: "36px",
            maxHeight: "200px",
            resize: "none",
            padding: "8px",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        />

        {/* Send button */}
        <button
          className="b3-button b3-button--primary"
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          title={i18n?.send || "Send"}
          style={{ padding: "4px 16px", flexShrink: 0 }}
        >
          {isLoading ? "⏳" : "📤"} {i18n?.send || "Send"}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
