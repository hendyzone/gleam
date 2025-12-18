import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../../contexts/AppContext";
import { useUIContext } from "../../../contexts/UIContext";
import { useModelSelection } from "../../../hooks/business/useModelSelection";
import { useModelParameters } from "../../../hooks/business/useModelParameters";
import { ModelParameters } from "../../../utils/types";
import ParameterInput from "./ParameterInput";
import "./ParametersPanel.scss";

const ParametersPanel: React.FC = () => {
  const { i18n } = useAppContext();
  const { state: uiState, dispatch: uiDispatch } = useUIContext();
  const { currentModel, getModelInfo } = useModelSelection();
  const { getCurrentParameters, saveParameters } = useModelParameters();

  const [parameters, setParameters] = useState<ModelParameters>({});

  const currentModelInfo = currentModel ? getModelInfo(currentModel) : null;

  useEffect(() => {
    if (uiState.showParametersPanel && currentModel) {
      const currentParams = getCurrentParameters();
      setParameters(currentParams);
    }
  }, [uiState.showParametersPanel, currentModel]);

  if (!uiState.showParametersPanel) {
    return null;
  }

  const handleClose = () => {
    uiDispatch({ type: "SHOW_PARAMETERS_PANEL", payload: false });
  };

  const handleSave = async () => {
    await saveParameters(parameters);
    handleClose();
  };

  const handleReset = () => {
    const defaultParams = currentModelInfo?.defaultParameters || {};
    setParameters({ ...defaultParams });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleParameterRemove = (key: string) => {
    setParameters((prev) => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  };

  const supportedParams = currentModelInfo?.supportedParameters || [];
  const defaultParams = currentModelInfo?.defaultParameters || {};

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 999999
  };

  return createPortal(
    <div className="gleam-parameters-panel" style={overlayStyle} onClick={handleOverlayClick}>
      <div className="gleam-parameters-panel-content">
        <div className="gleam-parameters-panel-header">
          <div className="gleam-parameters-panel-title">
            {i18n?.modelParameters || "模型参数配置"}
          </div>
          <button
            className="gleam-parameters-panel-close"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>

        <div className="gleam-parameters-panel-body">
          {!currentModelInfo && (
            <div style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>
              请先选择模型
            </div>
          )}

          {currentModelInfo && supportedParams.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>
              该模型不支持自定义参数
            </div>
          )}

          {currentModelInfo && supportedParams.length > 0 && (
            <div>
              {supportedParams.map((param) => {
                const defaultValue = defaultParams[param as keyof typeof defaultParams];
                const currentValue = parameters[param as keyof ModelParameters];
                const displayValue = currentValue !== undefined ? currentValue : defaultValue;

                return (
                  <ParameterInput
                    key={param}
                    paramKey={param}
                    value={displayValue}
                    onChange={(value) => handleParameterChange(param, value)}
                    onRemove={() => handleParameterRemove(param)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="gleam-parameters-panel-actions">
          <button
            className="gleam-button"
            onClick={handleReset}
            disabled={!currentModelInfo}
          >
            重置为默认值
          </button>
          <button className="gleam-button" onClick={handleClose}>
            取消
          </button>
          <button
            className="gleam-button"
            onClick={handleSave}
            disabled={!currentModelInfo}
          >
            保存
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ParametersPanel;
