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
    <div className="gleam-message-image">
      <img
        src={imageUrl}
        alt="Message attachment"
        onClick={handleZoom}
      />
      <div className="gleam-image-actions">
        <button
          className="gleam-image-action-btn"
          onClick={handleZoom}
          title={i18n?.zoomImage || "Zoom"}
        >
          🔍
        </button>
        <button
          className="gleam-image-action-btn"
          onClick={handleCopy}
          title={i18n?.copyImage || "Copy"}
        >
          📋
        </button>
      </div>
    </div>
  );
};

export default MessageImage;
