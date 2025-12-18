import React, { useState } from "react";
import { useAppContext } from "../../../contexts/AppContext";
import { useConfigContext } from "../../../contexts/ConfigContext";
import { useUIContext } from "../../../contexts/UIContext";
import { useModelSelection } from "../../../hooks/business/useModelSelection";
import ModelSearch from "./ModelSearch";
import ModelFilters from "./ModelFilters";
import ModelList from "./ModelList";
import "./ModelDialog.module.scss";

const ModelDialog: React.FC = () => {
  const { i18n } = useAppContext();
  const { state: configState } = useConfigContext();
  const { state: uiState, dispatch: uiDispatch } = useUIContext();
  const { selectModel } = useModelSelection();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedInputTypes, setSelectedInputTypes] = useState<Set<string>>(new Set());
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<Set<string>>(new Set());

  if (!uiState.showModelDialog) {
    return null;
  }

  const handleClose = () => {
    uiDispatch({ type: "SHOW_MODEL_DIALOG", payload: false });
    // Reset filters
    setSearchKeyword("");
    setSelectedInputTypes(new Set());
    setSelectedOutputTypes(new Set());
  };

  const handleSelect = async (modelId: string) => {
    await selectModel(modelId);
    handleClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="gleam-model-dialog" onClick={handleOverlayClick}>
      <div className="gleam-model-dialog-content">
        <div className="gleam-model-dialog-header">
          <div className="gleam-model-dialog-title">
            {i18n?.selectModel || "选择模型"}
          </div>
          <button
            className="gleam-model-dialog-close"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>

        <ModelSearch
          value={searchKeyword}
          onChange={setSearchKeyword}
          placeholder={i18n?.searchModel || "搜索模型..."}
        />

        <ModelFilters
          selectedInputTypes={selectedInputTypes}
          selectedOutputTypes={selectedOutputTypes}
          onInputTypesChange={setSelectedInputTypes}
          onOutputTypesChange={setSelectedOutputTypes}
          i18n={i18n}
        />

        <ModelList
          modelsInfo={configState.allModelsInfo}
          currentModel={configState.currentModel}
          searchKeyword={searchKeyword}
          selectedInputTypes={selectedInputTypes}
          selectedOutputTypes={selectedOutputTypes}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
};

export default ModelDialog;
