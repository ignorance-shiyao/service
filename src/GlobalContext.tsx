
import React, { useContext } from 'react';
import { Domain } from './types';

export type ViewMode = 'fusion' | 'switching';

export interface GlobalContextType {
  mode: ViewMode;
  currentDomain: Domain | null; // null represents the 'Root' or 'All' context depending on mode
  setMode: (mode: ViewMode) => void;
  setCurrentDomain: (domain: Domain | null) => void;
}

export const GlobalContext = React.createContext<GlobalContextType>({
  mode: 'fusion',
  currentDomain: null,
  setMode: () => {},
  setCurrentDomain: () => {},
});

export const useGlobalContext = () => useContext(GlobalContext);
