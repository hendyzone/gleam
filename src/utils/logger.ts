export class Logger {
  private static enabled: boolean = false;
  private static plugin: any = null;

  static init(plugin: any) {
    Logger.plugin = plugin;
    Logger.updateEnabled();
  }

  static async updateEnabled() {
    if (!Logger.plugin) return;
    try {
      const storage = (await import('../storage/data')).DataStorage;
      const dataStorage = new storage(Logger.plugin);
      const config = await dataStorage.getConfig();
      Logger.enabled = config.enableDebugLog || false;
    } catch (error) {
      Logger.enabled = false;
    }
  }

  static log(...args: any[]) {
    if (Logger.enabled) {
      console.log(...args);
    }
  }

  static warn(...args: any[]) {
    if (Logger.enabled) {
      console.warn(...args);
    }
  }

  static error(...args: any[]) {
    console.error(...args);
  }
}

