import React from "react";
import { useAttachment } from "../../../hooks/business/useAttachment";

const AttachmentPreview: React.FC = () => {
  const { images, audio, removeImage } = useAttachment();

  if (images.length === 0 && audio.length === 0) {
    return null;
  }

  return (
    <div
      className="gleam-attachment-preview"
      style={{
        padding: "8px",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        maxHeight: "120px",
        overflowY: "auto",
      }}
    >
      {/* Image previews */}
      {images.map((imageUrl, index) => (
        <div
          key={index}
          style={{
            position: "relative",
            width: "80px",
            height: "80px",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <img
            src={imageUrl}
            alt={`Attachment ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <button
            className="b3-button"
            onClick={() => removeImage(imageUrl)}
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              padding: "2px 6px",
              fontSize: "10px",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      ))}

      {/* Audio previews */}
      {audio.map((audioData, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px",
            background: "#f5f5f5",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          🎵 Audio {index + 1} ({audioData.format})
        </div>
      ))}
    </div>
  );
};

export default AttachmentPreview;
