import React from "react";

interface ModelFiltersProps {
  selectedInputTypes: Set<string>;
  selectedOutputTypes: Set<string>;
  onInputTypesChange: (types: Set<string>) => void;
  onOutputTypesChange: (types: Set<string>) => void;
  i18n: any;
}

const ModelFilters: React.FC<ModelFiltersProps> = ({
  selectedInputTypes,
  selectedOutputTypes,
  onInputTypesChange,
  onOutputTypesChange,
  i18n
}) => {
  const inputTypes = [
    { value: "text", label: "文本" },
    { value: "image", label: "图片" },
    { value: "file", label: "文件" },
    { value: "audio", label: "音频" },
    { value: "video", label: "视频" }
  ];

  const outputTypes = [
    { value: "text", label: "文本" },
    { value: "image", label: "图片" },
    { value: "embeddings", label: "嵌入" }
  ];

  const handleInputTypeChange = (type: string, checked: boolean) => {
    const newTypes = new Set(selectedInputTypes);
    if (checked) {
      newTypes.add(type);
    } else {
      newTypes.delete(type);
    }
    onInputTypesChange(newTypes);
  };

  const handleOutputTypeChange = (type: string, checked: boolean) => {
    const newTypes = new Set(selectedOutputTypes);
    if (checked) {
      newTypes.add(type);
    } else {
      newTypes.delete(type);
    }
    onOutputTypesChange(newTypes);
  };

  return (
    <div className="gleam-model-dialog-filters">
      <div className="gleam-model-dialog-filter-group">
        <div className="gleam-model-dialog-filter-label">
          {i18n?.filterInput || "输入类型:"}
        </div>
        <div className="gleam-model-dialog-filter-options">
          {inputTypes.map(({ value, label }) => (
            <label key={value} className="gleam-model-dialog-filter-option">
              <input
                type="checkbox"
                value={value}
                checked={selectedInputTypes.has(value)}
                onChange={(e) => handleInputTypeChange(value, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="gleam-model-dialog-filter-group">
        <div className="gleam-model-dialog-filter-label">
          {i18n?.filterOutput || "输出类型:"}
        </div>
        <div className="gleam-model-dialog-filter-options">
          {outputTypes.map(({ value, label }) => (
            <label key={value} className="gleam-model-dialog-filter-option">
              <input
                type="checkbox"
                value={value}
                checked={selectedOutputTypes.has(value)}
                onChange={(e) => handleOutputTypeChange(value, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelFilters;
