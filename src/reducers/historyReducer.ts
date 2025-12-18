import { ChatHistory } from "../utils/types";

export interface HistoryState {
  history: ChatHistory[];
  currentHistoryId: string | null;
  isLoadingHistory: boolean;
}

export type HistoryAction =
  | { type: "SET_HISTORY"; payload: ChatHistory[] }
  | { type: "ADD_HISTORY_ITEM"; payload: ChatHistory }
  | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "SET_CURRENT_HISTORY"; payload: string | null }
  | { type: "SET_LOADING_HISTORY"; payload: boolean };

export const initialHistoryState: HistoryState = {
  history: [],
  currentHistoryId: null,
  isLoadingHistory: false,
};

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "SET_HISTORY":
      return {
        ...state,
        history: action.payload,
      };

    case "ADD_HISTORY_ITEM":
      return {
        ...state,
        history: [action.payload, ...state.history],
      };

    case "TOGGLE_FAVORITE": {
      return {
        ...state,
        history: state.history.map((item) =>
          item.id === action.payload
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ),
      };
    }

    case "SET_CURRENT_HISTORY":
      return {
        ...state,
        currentHistoryId: action.payload,
      };

    case "SET_LOADING_HISTORY":
      return {
        ...state,
        isLoadingHistory: action.payload,
      };

    default:
      return state;
  }
}
