import React from "react";

interface ModelSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const ModelSearch: React.FC<ModelSearchProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="gleam-model-dialog-search">
      <input
        type="text"
        className="gleam-model-dialog-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus
      />
    </div>
  );
};

export default ModelSearch;
