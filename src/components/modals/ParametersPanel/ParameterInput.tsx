import React from "react";
import { SupportedParameter } from "../../../utils/types";

interface ParameterInputProps {
  paramKey: string;
  value: any;
  onChange: (value: any) => void;
  onRemove: () => void;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  paramKey,
  value,
  onChange,
  onRemove
}) => {
  // 参数配置映射
  const paramConfig: Record<
    SupportedParameter,
    {
      label: string;
      type: string;
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
    }
  > = {
    temperature: {
      label: "Temperature",
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      placeholder: "0.7"
    },
    top_p: {
      label: "Top P",
      type: "number",
      min: 0,
      max: 1,
      step: 0.01,
      placeholder: "1.0"
    },
    top_k: {
      label: "Top K",
      type: "number",
      min: 1,
      max: 100,
      step: 1,
      placeholder: "40"
    },
    min_p: {
      label: "Min P",
      type: "number",
      min: 0,
      max: 1,
      step: 0.01,
      placeholder: "0.0"
    },
    top_a: {
      label: "Top A",
      type: "number",
      min: 0,
      max: 1,
      step: 0.01,
      placeholder: "0.0"
    },
    frequency_penalty: {
      label: "Frequency Penalty",
      type: "number",
      min: -2,
      max: 2,
      step: 0.1,
      placeholder: "0.0"
    },
    presence_penalty: {
      label: "Presence Penalty",
      type: "number",
      min: -2,
      max: 2,
      step: 0.1,
      placeholder: "0.0"
    },
    repetition_penalty: {
      label: "Repetition Penalty",
      type: "number",
      min: 0.1,
      max: 2,
      step: 0.1,
      placeholder: "1.0"
    },
    max_tokens: {
      label: "Max Tokens",
      type: "number",
      min: 1,
      max: 100000,
      step: 1,
      placeholder: "2048"
    },
    seed: {
      label: "Seed",
      type: "number",
      min: 0,
      max: 2147483647,
      step: 1,
      placeholder: "随机"
    },
    logit_bias: {
      label: "Logit Bias",
      type: "text",
      placeholder: "JSON 对象"
    },
    logprobs: {
      label: "Logprobs",
      type: "number",
      min: 0,
      max: 20,
      step: 1,
      placeholder: "0"
    },
    top_logprobs: {
      label: "Top Logprobs",
      type: "number",
      min: 0,
      max: 20,
      step: 1,
      placeholder: "0"
    },
    response_format: {
      label: "Response Format",
      type: "text",
      placeholder: "JSON 对象"
    },
    structured_outputs: {
      label: "Structured Outputs",
      type: "text",
      placeholder: "JSON 对象"
    },
    stop: {
      label: "Stop Sequences",
      type: "text",
      placeholder: "用逗号分隔"
    },
    tools: {
      label: "Tools",
      type: "text",
      placeholder: "JSON 数组"
    },
    tool_choice: {
      label: "Tool Choice",
      type: "text",
      placeholder: "auto/none/required"
    },
    parallel_tool_calls: {
      label: "Parallel Tool Calls",
      type: "checkbox"
    },
    include_reasoning: {
      label: "Include Reasoning",
      type: "checkbox"
    },
    reasoning: {
      label: "Reasoning",
      type: "text",
      placeholder: "JSON 对象"
    },
    web_search_options: {
      label: "Web Search Options",
      type: "text",
      placeholder: "JSON 对象"
    },
    verbosity: {
      label: "Verbosity",
      type: "text",
      placeholder: "low/medium/high"
    }
  };

  const config = paramConfig[paramKey as SupportedParameter];

  if (!config) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (config.type === "checkbox") {
      onChange(e.target.checked ? true : undefined);
    } else if (config.type === "number") {
      const val = parseFloat(e.target.value);
      onChange(isNaN(val) || e.target.value === "" ? undefined : val);
    } else {
      const val = e.target.value.trim();
      if (!val) {
        onChange(undefined);
        return;
      }

      // 尝试解析 JSON
      if (val.startsWith("{") || val.startsWith("[")) {
        try {
          onChange(JSON.parse(val));
        } catch {
          // 如果不是有效的 JSON
          if (paramKey === "stop") {
            onChange(val.split(",").map((s) => s.trim()).filter((s) => s));
          } else {
            onChange(val);
          }
        }
      } else if (paramKey === "stop") {
        onChange(val.split(",").map((s) => s.trim()).filter((s) => s));
      } else {
        onChange(val);
      }
    }
  };

  const displayValue =
    config.type === "checkbox"
      ? value === true
      : config.type === "text"
      ? typeof value === "object"
        ? JSON.stringify(value)
        : Array.isArray(value)
        ? value.join(", ")
        : value || ""
      : value !== undefined
      ? value
      : "";

  if (config.type === "checkbox") {
    return (
      <div className="gleam-parameter-field">
        <label className="gleam-parameter-label">
          <input
            type="checkbox"
            checked={value === true}
            onChange={handleChange}
          />
          <span>{config.label}</span>
        </label>
        <div className="gleam-parameter-description">{paramKey}</div>
      </div>
    );
  } else if (config.type === "text") {
    return (
      <div className="gleam-parameter-field">
        <label className="gleam-parameter-label">{config.label}</label>
        <input
          type="text"
          className="gleam-parameter-input"
          value={displayValue}
          onChange={handleChange}
          placeholder={config.placeholder || ""}
        />
        <div className="gleam-parameter-description">{paramKey}</div>
      </div>
    );
  } else {
    return (
      <div className="gleam-parameter-field">
        <label className="gleam-parameter-label">{config.label}</label>
        <input
          type="number"
          className="gleam-parameter-input"
          value={displayValue}
          onChange={handleChange}
          min={config.min}
          max={config.max}
          step={config.step}
          placeholder={config.placeholder || ""}
        />
        <div className="gleam-parameter-description">{paramKey}</div>
      </div>
    );
  }
};

export default ParameterInput;
