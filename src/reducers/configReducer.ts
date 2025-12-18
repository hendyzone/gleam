import { PluginConfig, ModelInfo, ModelParameters } from "../utils/types";

export interface ConfigState {
  config: PluginConfig | null;
  allModels: string[];
  allModelsInfo: ModelInfo[];
  currentModel: string;
  enableContext: boolean;
  modelParameters: Record<string, ModelParameters>;
  isLoadingModels: boolean;
}

export type ConfigAction =
  | { type: "SET_CONFIG"; payload: PluginConfig }
  | { type: "SET_MODELS"; payload: { models: string[]; modelsInfo: ModelInfo[] } }
  | { type: "SET_CURRENT_MODEL"; payload: string }
  | { type: "SET_ENABLE_CONTEXT"; payload: boolean }
  | { type: "SET_MODEL_PARAMETERS"; payload: { modelId: string; parameters: ModelParameters } }
  | { type: "SET_LOADING_MODELS"; payload: boolean };

export const initialConfigState: ConfigState = {
  config: null,
  allModels: [],
  allModelsInfo: [],
  currentModel: "",
  enableContext: false,
  modelParameters: {},
  isLoadingModels: false,
};

export function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case "SET_CONFIG":
      return {
        ...state,
        config: action.payload,
        currentModel: action.payload.currentModel || state.currentModel,
        enableContext: action.payload.enableContext ?? state.enableContext,
        modelParameters: action.payload.modelParameters || state.modelParameters,
      };

    case "SET_MODELS":
      return {
        ...state,
        allModels: action.payload.models,
        allModelsInfo: action.payload.modelsInfo,
      };

    case "SET_CURRENT_MODEL":
      return {
        ...state,
        currentModel: action.payload,
      };

    case "SET_ENABLE_CONTEXT":
      return {
        ...state,
        enableContext: action.payload,
      };

    case "SET_MODEL_PARAMETERS":
      return {
        ...state,
        modelParameters: {
          ...state.modelParameters,
          [action.payload.modelId]: action.payload.parameters,
        },
      };

    case "SET_LOADING_MODELS":
      return {
        ...state,
        isLoadingModels: action.payload,
      };

    default:
      return state;
  }
}
