import { useAppContext } from "../../contexts/AppContext";
import { useConfigContext } from "../../contexts/ConfigContext";
import { useUIContext } from "../../contexts/UIContext";
import { ModelInfo } from "../../utils/types";
import { Logger } from "../../utils/logger";

export const useModelSelection = () => {
  const { providers, storage } = useAppContext();
  const { state: configState, dispatch: configDispatch } = useConfigContext();
  const { dispatch: uiDispatch } = useUIContext();

  /**
   * 加载模型列表
   */
  const loadModels = async (provider: string = "openrouter"): Promise<void> => {
    try {
      configDispatch({ type: "SET_LOADING_MODELS", payload: true });

      const config = await storage.getConfig();
      const apiKey = config.openrouter?.apiKey;

      if (!apiKey || apiKey.trim() === "") {
        configDispatch({ type: "SET_MODELS", payload: { models: [], modelsInfo: [] } });
        configDispatch({ type: "SET_LOADING_MODELS", payload: false });
        return;
      }

      const aiProvider = providers.get(provider);
      if (!aiProvider) {
        throw new Error("Provider not found");
      }

      // 使用 getModelsWithInfo 获取详细信息
      if (typeof (aiProvider as any).getModelsWithInfo === "function") {
        const modelsInfo: ModelInfo[] = await (aiProvider as any).getModelsWithInfo(apiKey);
        const models = modelsInfo.map((m: ModelInfo) => m.id);

        configDispatch({
          type: "SET_MODELS",
          payload: { models, modelsInfo }
        });

        Logger.log(`Loaded ${modelsInfo.length} models with info`);
      } else {
        // 降级方案：只获取模型ID
        const models: string[] = await aiProvider.getModels(apiKey);
        const modelsInfo: ModelInfo[] = models.map((id: string) => ({
          id,
          name: id,
          inputModalities: ["text"],
          outputModalities: ["text"]
        }));

        configDispatch({
          type: "SET_MODELS",
          payload: { models, modelsInfo }
        });

        Logger.log(`Loaded ${models.length} models (fallback)`);
      }

      configDispatch({ type: "SET_LOADING_MODELS", payload: false });
    } catch (error: any) {
      Logger.error("Failed to load models:", error);
      configDispatch({ type: "SET_MODELS", payload: { models: [], modelsInfo: [] } });
      configDispatch({ type: "SET_LOADING_MODELS", payload: false });

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: error?.message || "Failed to load models"
        }
      });

      throw error;
    }
  };

  /**
   * 选择模型
   */
  const selectModel = async (modelId: string): Promise<void> => {
    try {
      const config = await storage.getConfig();
      config.currentModel = modelId;
      await storage.saveConfig(config);

      configDispatch({ type: "SET_CURRENT_MODEL", payload: modelId });

      Logger.log(`Model selected: ${modelId}`);
    } catch (error: any) {
      Logger.error("Failed to select model:", error);
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Failed to save model selection"
        }
      });
    }
  };

  /**
   * 显示模型选择对话框
   */
  const showModelDialog = async (): Promise<void> => {
    // 如果模型列表为空，尝试加载
    if (configState.allModelsInfo.length === 0) {
      const config = await storage.getConfig();
      const apiKey = config.openrouter?.apiKey;

      if (!apiKey || apiKey.trim() === "") {
        uiDispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            type: "error",
            message: "API key is required"
          }
        });
        return;
      }

      try {
        await loadModels("openrouter");

        if (configState.allModelsInfo.length === 0) {
          uiDispatch({
            type: "ADD_NOTIFICATION",
            payload: {
              type: "error",
              message: "Failed to load models"
            }
          });
          return;
        }
      } catch (error) {
        return; // Error already handled in loadModels
      }
    }

    uiDispatch({ type: "SHOW_MODEL_DIALOG", payload: true });
  };

  /**
   * 获取模型信息
   */
  const getModelInfo = (modelId: string): ModelInfo | undefined => {
    return configState.allModelsInfo.find(m => m.id === modelId);
  };

  return {
    allModels: configState.allModels,
    allModelsInfo: configState.allModelsInfo,
    currentModel: configState.currentModel,
    isLoadingModels: configState.isLoadingModels,
    loadModels,
    selectModel,
    showModelDialog,
    getModelInfo
  };
};
