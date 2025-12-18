export interface Notification {
  id: string;
  type: "error" | "success";
  message: string;
}

export interface UIState {
  showHistoryPanel: boolean;
  showModelDialog: boolean;
  showParametersPanel: boolean;
  showImageZoom: boolean;
  imageZoomUrl: string | null;
  notifications: Notification[];
  attachments: {
    images: string[];
    audio: Array<{ data: string; format: string }>;
  };
}

export type UIAction =
  | { type: "TOGGLE_HISTORY_PANEL" }
  | { type: "SHOW_MODEL_DIALOG"; payload: boolean }
  | { type: "SHOW_PARAMETERS_PANEL"; payload: boolean }
  | { type: "SHOW_IMAGE_ZOOM"; payload: { show: boolean; url: string | null } }
  | { type: "ADD_NOTIFICATION"; payload: { type: "error" | "success"; message: string } }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "ADD_ATTACHMENT_IMAGE"; payload: string }
  | { type: "ADD_ATTACHMENT_AUDIO"; payload: { data: string; format: string } }
  | { type: "REMOVE_ATTACHMENT_IMAGE"; payload: string }
  | { type: "CLEAR_ATTACHMENTS" };

export const initialUIState: UIState = {
  showHistoryPanel: false,
  showModelDialog: false,
  showParametersPanel: false,
  showImageZoom: false,
  imageZoomUrl: null,
  notifications: [],
  attachments: {
    images: [],
    audio: [],
  },
};

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "TOGGLE_HISTORY_PANEL":
      return {
        ...state,
        showHistoryPanel: !state.showHistoryPanel,
      };

    case "SHOW_MODEL_DIALOG":
      return {
        ...state,
        showModelDialog: action.payload,
      };

    case "SHOW_PARAMETERS_PANEL":
      return {
        ...state,
        showParametersPanel: action.payload,
      };

    case "SHOW_IMAGE_ZOOM":
      return {
        ...state,
        showImageZoom: action.payload.show,
        imageZoomUrl: action.payload.url,
      };

    case "ADD_NOTIFICATION": {
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: action.payload.type,
        message: action.payload.message,
      };
      return {
        ...state,
        notifications: [...state.notifications, notification],
      };
    }

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case "ADD_ATTACHMENT_IMAGE":
      return {
        ...state,
        attachments: {
          ...state.attachments,
          images: [...state.attachments.images, action.payload],
        },
      };

    case "ADD_ATTACHMENT_AUDIO":
      return {
        ...state,
        attachments: {
          ...state.attachments,
          audio: [...state.attachments.audio, action.payload],
        },
      };

    case "REMOVE_ATTACHMENT_IMAGE":
      return {
        ...state,
        attachments: {
          ...state.attachments,
          images: state.attachments.images.filter((img) => img !== action.payload),
        },
      };

    case "CLEAR_ATTACHMENTS":
      return {
        ...state,
        attachments: {
          images: [],
          audio: [],
        },
      };

    default:
      return state;
  }
}
