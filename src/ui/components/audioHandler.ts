import { Logger } from '../../utils/logger';

/**
 * 音频处理工具类
 */
export class AudioHandler {
  /**
   * 根据文件扩展名获取音频格式
   * 支持的格式参考：https://openrouter.ai/docs/guides/overview/multimodal/audio
   */
  static getAudioFormat(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const formatMap: Record<string, string> = {
      'wav': 'wav',      // WAV audio
      'mp3': 'mp3',      // MP3 audio
      'aiff': 'aiff',    // AIFF audio
      'aac': 'aac',      // AAC audio
      'ogg': 'ogg',      // OGG Vorbis audio
      'flac': 'flac',    // FLAC audio
      'm4a': 'm4a',      // M4A audio
      'pcm': 'pcm16'     // PCM16 audio (默认)
    };
    // 默认使用 wav，这是最通用的格式
    return formatMap[ext] || 'wav';
  }

  /**
   * 将文件转换为 base64（返回纯 base64 字符串，不含 data URL 前缀）
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 提取纯 base64 数据（去掉 data:audio/xxx;base64, 前缀）
        const base64Match = result.match(/^data:audio\/[^;]+;base64,(.+)$/);
        if (base64Match && base64Match[1]) {
          resolve(base64Match[1]);
        } else {
          // 如果没有匹配到，尝试直接使用（可能是纯 base64）
          resolve(result.replace(/^data:[^;]+;base64,/, ''));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 处理音频选择事件
   */
  static async handleAudioSelect(
    files: File[],
    onError: (message: string) => void
  ): Promise<Array<{ name: string; data: string; format: string }>> {
    if (!files || files.length === 0) return [];

    const audioFiles: Array<{ name: string; data: string; format: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) {
        onError('只能选择音频文件');
        continue;
      }

      try {
        const base64 = await this.fileToBase64(file);
        const format = this.getAudioFormat(file.name);
        audioFiles.push({
          name: file.name,
          data: base64,
          format: format
        });
      } catch (error) {
        Logger.error('[AudioHandler] 音频转换失败:', error);
        onError('音频加载失败');
      }
    }

    return audioFiles;
  }

  /**
   * 转义 HTML 特殊字符
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

