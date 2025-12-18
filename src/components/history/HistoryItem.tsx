import React from "react";
import { ChatHistory } from "../../../utils/types";

interface HistoryItemProps {
  item: ChatHistory;
  index: number;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, index, onSelect, onToggleFavorite, onDelete }) => {
  const handleClick = () => {
    onSelect(item.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除这条历史记录吗？\n\n${item.title}`)) {
      onDelete(item.id);
    }
  };

  return (
    <div className="gleam-history-item" onClick={handleClick}>
      <div className="gleam-history-item-number">{index + 1}</div>
      <div className="gleam-history-item-content">
        <div className="gleam-history-item-title">{item.title}</div>
        <div className="gleam-history-item-time">
          {new Date(item.timestamp).toLocaleString()}
        </div>
      </div>
      <button
        className={`gleam-history-favorite ${item.isFavorite ? "active" : ""}`}
        onClick={handleFavoriteClick}
        title={item.isFavorite ? "取消收藏" : "收藏"}
      >
        {item.isFavorite ? "⭐" : "☆"}
      </button>
      <button
        className="gleam-history-delete"
        onClick={handleDeleteClick}
        title="删除"
      >
        ✕
      </button>
    </div>
  );
};

export default HistoryItem;
