import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../../contexts/AppContext";
import { useConfigContext } from "../../../contexts/ConfigContext";
import { useUIContext } from "../../../contexts/UIContext";
import { useModelSelection } from "../../../hooks/business/useModelSelection";
import ModelSearch from "./ModelSearch";
import ModelFilters from "./ModelFilters";
import ModelList from "./ModelList";
import "./ModelDialog.scss";

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

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: 999999,
    margin: '0',
    padding: '0',
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return createPortal(
    <div style={overlayStyle} onClick={handleOverlayClick}>
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
    </div>,
    document.body
  );
};

export default ModelDialog;
