import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUIContext } from "../../contexts/UIContext";
import "./ImageZoom.scss";

const ImageZoom: React.FC = () => {
  const { state: uiState, dispatch: uiDispatch } = useUIContext();

  const handleClose = useCallback(() => {
    uiDispatch({ type: "SHOW_IMAGE_ZOOM", payload: { show: false, url: null } });
  }, [uiDispatch]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (uiState.showImageZoom) {
      // 禁止滚动
      document.body.style.overflow = "hidden";
    } else {
      // 恢复滚动
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [uiState.showImageZoom]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!uiState.showImageZoom || !uiState.imageZoomUrl) {
    return null;
  }

  return createPortal(
    <div className="gleam-image-zoom" onClick={handleOverlayClick}>
      <div className="gleam-image-zoom-content">
        <button className="gleam-image-zoom-close" onClick={handleClose}>
          &times;
        </button>
        <img
          src={uiState.imageZoomUrl}
          alt="Zoomed"
          className="gleam-image-zoom-img"
        />
      </div>
    </div>,
    document.body
  );
};

export default ImageZoom;
