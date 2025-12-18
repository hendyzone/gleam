import { useAppContext } from "../../contexts/AppContext";
import { useConfigContext } from "../../contexts/ConfigContext";
import { useUIContext } from "../../contexts/UIContext";
import { ModelParameters } from "../../utils/types";
import { Logger } from "../../utils/logger";

export const useModelParameters = () => {
  const { storage } = useAppContext();
  const { state: configState, dispatch: configDispatch } = useConfigContext();
  const { dispatch: uiDispatch } = useUIContext();

  /**
   * 获取当前模型的参数
   */
  const getCurrentParameters = (): ModelParameters => {
    const currentModel = configState.currentModel;
    if (!currentModel) {
      return {};
    }
    return configState.modelParameters[currentModel] || {};
  };

  /**
   * 保存模型参数
   */
  const saveParameters = async (parameters: ModelParameters): Promise<void> => {
    try {
      const currentModel = configState.currentModel;
      if (!currentModel) {
        uiDispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            type: "error",
            message: "No model selected"
          }
        });
        return;
      }

      // 更新 Context
      configDispatch({
        type: "SET_MODEL_PARAMETERS",
        payload: {
          model: currentModel,
          parameters
        }
      });

      // 保存到存储
      const config = await storage.getConfig();
      if (!config.modelParameters) {
        config.modelParameters = {};
      }
      config.modelParameters[currentModel] = parameters;
      await storage.saveConfig(config);

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: "Parameters saved"
        }
      });

      Logger.log(`Parameters saved for model: ${currentModel}`, parameters);
    } catch (error: any) {
      Logger.error("Failed to save parameters:", error);
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Failed to save parameters"
        }
      });
    }
  };

  /**
   * 显示参数配置面板
   */
  const showParametersPanel = (): void => {
    if (!configState.currentModel) {
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: "Please select a model first"
        }
      });
      return;
    }

    uiDispatch({ type: "SHOW_PARAMETERS_PANEL", payload: true });
  };

  /**
   * 重置参数为默认值
   */
  const resetParameters = async (): Promise<void> => {
    await saveParameters({});
  };

  return {
    currentModel: configState.currentModel,
    modelParameters: configState.modelParameters,
    getCurrentParameters,
    saveParameters,
    resetParameters,
    showParametersPanel
  };
};
