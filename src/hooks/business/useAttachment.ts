import { useUIContext } from "../../contexts/UIContext";

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to get audio format from file extension
const getAudioFormat = (filename: string): string => {
  const ext = filename.toLowerCase().split(".").pop();
  const formatMap: Record<string, string> = {
    wav: "wav",
    mp3: "mp3",
    m4a: "mp4",
    ogg: "ogg",
    flac: "flac",
    webm: "webm",
  };
  return formatMap[ext || ""] || "wav";
};

export const useAttachment = () => {
  const { state, dispatch } = useUIContext();

  const addImage = (base64: string) => {
    dispatch({
      type: "ADD_ATTACHMENT_IMAGE",
      payload: base64,
    });
  };

  const addAudio = (data: string, format: string) => {
    dispatch({
      type: "ADD_ATTACHMENT_AUDIO",
      payload: { data, format },
    });
  };

  const removeImage = (imageUrl: string) => {
    dispatch({
      type: "REMOVE_ATTACHMENT_IMAGE",
      payload: imageUrl,
    });
  };

  const clearAttachments = () => {
    dispatch({ type: "CLEAR_ATTACHMENTS" });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type.startsWith("image/")) {
        // Handle image
        const base64 = await fileToBase64(file);
        addImage(base64);
      } else if (file.type.startsWith("audio/")) {
        // Handle audio
        const base64 = await fileToBase64(file);
        // Remove data URL prefix to get pure base64
        const pureBase64 = base64.split(",")[1];
        const format = getAudioFormat(file.name);
        addAudio(pureBase64, format);
      }
    }
  };

  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const base64 = await fileToBase64(file);
          addImage(base64);
        }
      }
    }
  };

  return {
    images: state.attachments.images,
    audio: state.attachments.audio,
    addImage,
    addAudio,
    removeImage,
    clearAttachments,
    handleFileSelect,
    handlePaste,
  };
};
