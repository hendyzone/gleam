import { useAppContext } from "../../contexts/AppContext";
import { useChatContext } from "../../contexts/ChatContext";
import { useHistoryContext } from "../../contexts/HistoryContext";
import { useUIContext } from "../../contexts/UIContext";
import { ChatHistory, ChatMessage } from "../../utils/types";
import { Logger } from "../../utils/logger";

export const useHistory = () => {
  const { storage } = useAppContext();
  const { dispatch: chatDispatch } = useChatContext();
  const { state: historyState, dispatch: historyDispatch } = useHistoryContext();
  const { dispatch: uiDispatch } = useUIContext();

  /**
   * 加载历史记录列表
   */
  const loadHistory = async (): Promise<void> => {
    try {
      historyDispatch({ type: "SET_LOADING_HISTORY", payload: true });
      const history = await storage.getHistory();
      historyDispatch({ type: "SET_HISTORY", payload: history });
      historyDispatch({ type: "SET_LOADING_HISTORY", payload: false });
      Logger.log(`Loaded ${history.length} history items`);
    } catch (error: any) {
      Logger.error("Failed to load history:", error);
      historyDispatch({ type: "SET_LOADING_HISTORY", payload: false });
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Failed to load history"
        }
      });
    }
  };

  /**
   * 从历史记录加载对话
   */
  const loadChatFromHistory = async (id: string): Promise<void> => {
    try {
      const item = historyState.history.find((h) => h.id === id);
      if (!item) {
        uiDispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            type: "error",
            message: "History item not found"
          }
        });
        return;
      }

      // 设置消息
      chatDispatch({ type: "SET_MESSAGES", payload: [...item.messages] });

      // 检查是否包含上下文（第一条消息是 system 消息）
      const hasContextInjected = item.messages.length > 0 && item.messages[0].role === "system";
      chatDispatch({ type: "SET_CONTEXT_INJECTED", payload: hasContextInjected });

      // 设置当前历史ID
      historyDispatch({ type: "SET_CURRENT_HISTORY", payload: id });

      // 关闭历史面板
      uiDispatch({ type: "TOGGLE_HISTORY_PANEL" });

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: "Chat loaded"
        }
      });

      Logger.log(`Loaded chat from history: ${id}`);
    } catch (error: any) {
      Logger.error("Failed to load chat from history:", error);
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Failed to load chat"
        }
      });
    }
  };

  /**
   * 切换收藏状态
   */
  const toggleFavorite = async (id: string): Promise<void> => {
    try {
      await storage.toggleFavorite(id);

      // 重新加载历史列表以更新UI
      await loadHistory();

      Logger.log(`Toggled favorite: ${id}`);
    } catch (error: any) {
      Logger.error("Failed to toggle favorite:", error);
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Failed to toggle favorite"
        }
      });
    }
  };

  /**
   * 删除历史记录项
   */
  const deleteHistoryItem = async (id: string): Promise<void> => {
    try {
      await storage.deleteHistoryItem(id);

      // 重新加载历史列表以更新UI
      await loadHistory();

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: "History item deleted"
        }
      });

      Logger.log(`Deleted history item: ${id}`);
    } catch (error: any) {
      Logger.error("Failed to delete history item:", error);
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Failed to delete history item"
        }
      });
    }
  };

  /**
   * 保存当前对话
   */
  const saveCurrentChat = async (messages: ChatMessage[]): Promise<void> => {
    if (messages.length === 0) return;

    try {
      const title = messages.find((m) => m.role === "user")?.content?.substring(0, 50) || "New Chat";
      const historyItem: ChatHistory = {
        id: `chat-${Date.now()}`,
        title,
        messages: [...messages],
        timestamp: Date.now()
      };

      await storage.addHistoryItem(historyItem);

      Logger.log(`Saved chat: ${historyItem.id}`);
    } catch (error: any) {
      Logger.error("Failed to save chat:", error);
    }
  };

  /**
   * 检查是否有历史记录
   */
  const hasHistory = async (): Promise<boolean> => {
    const history = await storage.getHistory();
    return history.length > 0;
  };

  return {
    history: historyState.history,
    currentHistoryId: historyState.currentHistoryId,
    isLoadingHistory: historyState.isLoadingHistory,
    loadHistory,
    loadChatFromHistory,
    toggleFavorite,
    deleteHistoryItem,
    saveCurrentChat,
    hasHistory
  };
};
