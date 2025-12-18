import React, { useEffect } from "react";
import ChatContainer from "../components/chat/ChatContainer";
import ModelDialog from "../components/modals/ModelDialog/ModelDialog";
import ParametersPanel from "../components/modals/ParametersPanel/ParametersPanel";
import HistoryPanel from "../components/history/HistoryPanel";
import ImageZoom from "../components/common/ImageZoom";
import Notifications from "../components/common/Notifications";
import { useChat } from "../hooks/business/useChat";
import { useAppContext } from "../contexts/AppContext";
import { useConfigContext } from "../contexts/ConfigContext";

const App: React.FC = () => {
  const { addMessage } = useChat();
  const { storage } = useAppContext();
  const { dispatch: configDispatch } = useConfigContext();

  // 在应用启动时加载配置
  useEffect(() => {
    const loadConfig = async () => {
      const config = await storage.getConfig();
      configDispatch({ type: "SET_CONFIG", payload: config });
    };
    loadConfig();
  }, [storage, configDispatch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Main chat container */}
      <ChatContainer />

      {/* Modals */}
      <ModelDialog />
      <ParametersPanel />
      <HistoryPanel />

      {/* Global UI Components */}
      <ImageZoom />
      <Notifications />
    </div>
  );
};

export default App;
