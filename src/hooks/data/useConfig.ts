import { useConfigContext } from "../../contexts/ConfigContext";

export const useConfig = () => {
  const { state, dispatch } = useConfigContext();

  return {
    config: state.config,
    allModels: state.allModels,
    allModelsInfo: state.allModelsInfo,
    currentModel: state.currentModel,
    enableContext: state.enableContext,
    modelParameters: state.modelParameters,
    isLoadingModels: state.isLoadingModels,
    dispatch,
  };
};
