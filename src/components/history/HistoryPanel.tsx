import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../contexts/AppContext";
import { useUIContext } from "../../contexts/UIContext";
import { useHistory } from "../../hooks/business/useHistory";
import HistoryItem from "./HistoryItem";
import "./HistoryPanel.scss";

const HistoryPanel: React.FC = () => {
  const { i18n } = useAppContext();
  const { state: uiState, dispatch: uiDispatch } = useUIContext();
  const { history, isLoadingHistory, loadHistory, loadChatFromHistory, toggleFavorite, deleteHistoryItem } = useHistory();

  // 加载历史记录（当面板打开时）
  useEffect(() => {
    if (uiState.showHistoryPanel) {
      loadHistory();
    }
  }, [uiState.showHistoryPanel, loadHistory]);

  const handleClose = useCallback(() => {
    uiDispatch({ type: "TOGGLE_HISTORY_PANEL" });
  }, [uiDispatch]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleSelect = useCallback(async (id: string) => {
    await loadChatFromHistory(id);
  }, [loadChatFromHistory]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    await toggleFavorite(id);
  }, [toggleFavorite]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteHistoryItem(id);
  }, [deleteHistoryItem]);

  if (!uiState.showHistoryPanel) {
    return null;
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: 999999,
    margin: '0',
    padding: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return createPortal(
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div className="gleam-history-panel-content">
        <div className="gleam-history-panel-header">
          <div className="gleam-history-panel-title">
            {i18n?.history || "历史记录"}
          </div>
          <button className="gleam-history-panel-close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="gleam-history-panel-body">
          {isLoadingHistory && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--b3-theme-on-background)",
                opacity: 0.6
              }}
            >
              {i18n?.loading || "加载中..."}
            </div>
          )}

          {!isLoadingHistory && history.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--b3-theme-on-background)",
                opacity: 0.6
              }}
            >
              {i18n?.noHistory || "暂无历史记录"}
            </div>
          )}

          {!isLoadingHistory && history.length > 0 && (
            <div>
              {history.map((item, index) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  index={index}
                  onSelect={handleSelect}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HistoryPanel;
