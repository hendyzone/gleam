import React from "react";
import { useAppContext } from "../../../contexts/AppContext";
import { useConfigContext } from "../../../contexts/ConfigContext";
import { useUIContext } from "../../../contexts/UIContext";
import { useChatContext } from "../../../contexts/ChatContext";
import { useModelSelection } from "../../../hooks/business/useModelSelection";
import { useModelParameters } from "../../../hooks/business/useModelParameters";
import { useExport } from "../../../hooks/business/useExport";

const ControlBar: React.FC = () => {
  const { i18n } = useAppContext();
  const { state: configState, dispatch: configDispatch } = useConfigContext();
  const { dispatch: chatDispatch } = useChatContext();
  const { dispatch: uiDispatch } = useUIContext();
  const { showModelDialog } = useModelSelection();
  const { showParametersPanel } = useModelParameters();
  const { exportToDocument } = useExport();

  const handleToggleContext = async () => {
    const newValue = !configState.enableContext;
    configDispatch({ type: "SET_ENABLE_CONTEXT", payload: newValue });

    // Save to storage (handled in context reducer ideally, or here)
    // For now, we'll assume the context reducer handles persistence
  };

  const handleNewChat = () => {
    if (confirm(i18n?.confirmNewChat || "确定要开始新对话吗？当前对话将被保存。")) {
      chatDispatch({ type: "CLEAR_MESSAGES" });
      chatDispatch({ type: "SET_CONTEXT_INJECTED", payload: false });
    }
  };

  const handleToggleHistory = () => {
    uiDispatch({ type: "TOGGLE_HISTORY_PANEL" });
  };

  const handleExport = async () => {
    await exportToDocument();
  };

  const modelButtonText = configState.currentModel || i18n?.selectModel || "选择模型";

  return (
    <div
      className="gleam-control-bar"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        padding: "12px",
        borderTop: "1px solid #e0e0e0",
        background: "#fff"
      }}
    >
      {/* 模型选择按钮 */}
      <button
        className="b3-button b3-button--outline"
        onClick={showModelDialog}
        title={i18n?.selectModel || "选择模型"}
        style={{ flex: "1 1 auto", minWidth: "120px" }}
      >
        <span id="gleam-model-button-text" style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {modelButtonText}
        </span>
      </button>

      {/* 上下文开关 */}
      <label
        className="b3-button b3-button--outline"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          userSelect: "none"
        }}
        title={i18n?.toggleContext || "启用/禁用上下文注入"}
      >
        <input
          type="checkbox"
          checked={configState.enableContext}
          onChange={handleToggleContext}
          style={{ margin: 0 }}
        />
        <span>{i18n?.context || "上下文"}</span>
      </label>

      {/* 参数配置按钮 */}
      <button
        className="b3-button b3-button--outline"
        onClick={showParametersPanel}
        disabled={!configState.currentModel}
        title={i18n?.modelParameters || "模型参数"}
      >
        ⚙️
      </button>

      {/* 导出按钮 */}
      <button
        className="b3-button b3-button--outline"
        onClick={handleExport}
        title={i18n?.exportToDocument || "导出为文档"}
      >
        📄
      </button>

      {/* 新对话按钮 */}
      <button
        className="b3-button b3-button--outline"
        onClick={handleNewChat}
        title={i18n?.newChat || "新对话"}
      >
        ➕
      </button>

      {/* 历史记录按钮 */}
      <button
        className="b3-button b3-button--outline"
        onClick={handleToggleHistory}
        title={i18n?.history || "历史记录"}
      >
        📜
      </button>
    </div>
  );
};

export default ControlBar;
