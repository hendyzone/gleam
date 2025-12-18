import React from "react";
import { useAppContext } from "../../../contexts/AppContext";
import { useUIContext } from "../../../contexts/UIContext";
import { copyImageToClipboard } from "../../../utils/clipboard";

interface MessageImageProps {
  imageUrl: string;
}

const MessageImage: React.FC<MessageImageProps> = ({ imageUrl }) => {
  const { i18n } = useAppContext();
  const { dispatch } = useUIContext();

  const handleZoom = () => {
    dispatch({
      type: "SHOW_IMAGE_ZOOM",
      payload: { show: true, url: imageUrl },
    });
  };

  const handleCopy = async () => {
    const success = await copyImageToClipboard(imageUrl);
    if (success) {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: i18n?.copyImageSuccess || "Image copied to clipboard"
        }
      });
    } else {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: i18n?.copyImageFailed || "Failed to copy image"
        }
      });
    }
  };

  return (
    <div className="gleam-message-image" style={{ marginTop: "8px", position: "relative" }}>
      <img
        src={imageUrl}
        alt="Message attachment"
        style={{
          maxWidth: "100%",
          maxHeight: "300px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={handleZoom}
      />
      <div
        className="gleam-image-actions"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          display: "flex",
          gap: "4px",
        }}
      >
        <button
          className="b3-button b3-button--small"
          onClick={handleZoom}
          title={i18n?.zoomImage || "Zoom"}
          style={{ padding: "4px 8px" }}
        >
          🔍
        </button>
        <button
          className="b3-button b3-button--small"
          onClick={handleCopy}
          title={i18n?.copyImage || "Copy"}
          style={{ padding: "4px 8px" }}
        >
          📋
        </button>
      </div>
    </div>
  );
};

export default MessageImage;
