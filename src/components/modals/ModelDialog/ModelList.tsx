import React, { useMemo } from "react";
import { ModelInfo } from "../../../utils/types";

interface ModelListProps {
  modelsInfo: ModelInfo[];
  currentModel: string;
  searchKeyword: string;
  selectedInputTypes: Set<string>;
  selectedOutputTypes: Set<string>;
  onSelect: (modelId: string) => void;
}

const ModelList: React.FC<ModelListProps> = ({
  modelsInfo,
  currentModel,
  searchKeyword,
  selectedInputTypes,
  selectedOutputTypes,
  onSelect
}) => {
  const filteredModels = useMemo(() => {
    let filtered = modelsInfo;

    // 文本搜索过滤
    if (searchKeyword) {
      const lowerKeyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (model) =>
          model.id.toLowerCase().includes(lowerKeyword) ||
          model.name.toLowerCase().includes(lowerKeyword)
      );
    }

    // 输入类型过滤
    if (selectedInputTypes.size > 0) {
      filtered = filtered.filter((model) => {
        const inputMods = model.inputModalities || ["text"];
        return Array.from(selectedInputTypes).some((type) =>
          inputMods.includes(type)
        );
      });
    }

    // 输出类型过滤
    if (selectedOutputTypes.size > 0) {
      filtered = filtered.filter((model) => {
        const outputMods = model.outputModalities || ["text"];
        return Array.from(selectedOutputTypes).some((type) =>
          outputMods.includes(type)
        );
      });
    }

    return filtered;
  }, [modelsInfo, searchKeyword, selectedInputTypes, selectedOutputTypes]);

  const modalityLabels: Record<string, string> = {
    text: "文本",
    image: "图片",
    file: "文件",
    audio: "音频",
    video: "视频",
    embeddings: "嵌入"
  };

  if (filteredModels.length === 0) {
    return (
      <div className="gleam-model-dialog-list">
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            opacity: 0.7,
            color: "var(--b3-theme-on-background)"
          }}
        >
          未找到模型
        </div>
      </div>
    );
  }

  return (
    <div className="gleam-model-dialog-list">
      {filteredModels.map((model) => {
        const isSelected = model.id === currentModel;
        const inputMods = (model.inputModalities || ["text"])
          .map((m) => modalityLabels[m] || m)
          .join(", ");
        const outputMods = (model.outputModalities || ["text"])
          .map((m) => modalityLabels[m] || m)
          .join(", ");

        return (
          <div
            key={model.id}
            className={`gleam-model-dialog-item ${isSelected ? "selected" : ""}`}
            onClick={() => onSelect(model.id)}
          >
            <div className="gleam-model-dialog-item-name">
              {model.name || model.id}
            </div>
            <div className="gleam-model-dialog-item-id">{model.id}</div>
            <div className="gleam-model-dialog-item-modalities">
              <span className="gleam-modality-badge input">
                输入: {inputMods}
              </span>
              <span className="gleam-modality-badge output">
                输出: {outputMods}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModelList;
