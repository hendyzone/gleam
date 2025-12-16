import { DataStorage } from "../../storage/data";
import { ModelParameters } from "../../utils/types";
import { ConfigService } from "../../services/ConfigService";
import { ParametersPanel } from "../components/parametersPanel";

/**
 * 参数管理器
 */
export class ParametersManager {
  constructor(
    private storage: DataStorage,
    private configService: ConfigService,
    private parametersPanel: ParametersPanel
  ) {}

  /**
   * 显示参数配置面板
   */
  async showParametersPanel(): Promise<void> {
    const config = await this.storage.getConfig();
    const currentModelInfo = this.configService.getModelInfo(config.currentModel);
    const modelParameters = config.modelParameters || {};
    const currentParameters = modelParameters[config.currentModel] || {};

    this.parametersPanel.show(currentModelInfo || null, currentParameters);
  }

  /**
   * 处理参数保存
   */
  async handleParametersSave(parameters: ModelParameters): Promise<void> {
    const config = await this.storage.getConfig();
    if (!config.modelParameters) {
      config.modelParameters = {};
    }
    if (config.currentModel) {
      config.modelParameters[config.currentModel] = parameters;
      await this.storage.saveConfig(config);
    }
  }
}

