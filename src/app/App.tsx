import React from "react";
import ChatContainer from "../components/chat/ChatContainer";
import ModelDialog from "../components/modals/ModelDialog/ModelDialog";
import ParametersPanel from "../components/modals/ParametersPanel/ParametersPanel";
import HistoryPanel from "../components/history/HistoryPanel";
import ImageZoom from "../components/common/ImageZoom";
import Notifications from "../components/common/Notifications";
import { useChat } from "../hooks/business/useChat";

const App: React.FC = () => {
  const { addMessage } = useChat();

  // Test function to add sample messages
  const addSampleMessages = () => {
    addMessage("user", "Hello! Can you help me with React?");
    addMessage(
      "assistant",
      "Of course! I'd be happy to help you with React. React is a popular JavaScript library for building user interfaces. What would you like to know?"
    );
    addMessage("user", "What are React hooks?");
    addMessage(
      "assistant",
      "React Hooks are functions that let you use state and other React features in functional components. Some common hooks include:\n\n- **useState**: Manages component state\n- **useEffect**: Handles side effects\n- **useContext**: Accesses context values\n- **useReducer**: Manages complex state logic\n\nHooks make it easier to reuse stateful logic and write cleaner code!"
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Test button for Phase 3 */}
      <div style={{ padding: "8px", background: "#fff3cd", borderBottom: "1px solid #ffc107" }}>
        <p style={{ fontSize: "12px", margin: "0 0 8px 0", color: "#856404" }}>
          ✨ Phase 5: Controls and Configuration - Testing Mode
        </p>
        <button
          className="b3-button b3-button--outline"
          onClick={addSampleMessages}
          style={{ fontSize: "12px", padding: "4px 12px" }}
        >
          📝 Add Sample Messages
        </button>
      </div>

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
