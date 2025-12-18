import { useAppContext } from "../../contexts/AppContext";
import { DataStorage } from "../../storage/data";

export const useDataStorage = (): DataStorage => {
  const { storage } = useAppContext();
  return storage;
};
