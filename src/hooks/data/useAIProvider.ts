import { useAppContext } from "../../contexts/AppContext";
import { AIProvider } from "../../api/base";

export const useAIProvider = () => {
  const { providers } = useAppContext();
  const { config } = useAppContext();

  const getCurrentProvider = (): AIProvider | undefined => {
    // For now, default to "openrouter"
    // Later will use config.currentProvider when config is loaded
    return providers.get("openrouter");
  };

  return {
    providers,
    getCurrentProvider,
  };
};
