import { useAIDock } from '../store/aidock';

export const useDockPanel = () => {
  const { state, setOpen, toggleMax, switchTab } = useAIDock();
  return {
    open: state.open,
    maximized: state.maximized,
    activeTab: state.activeTab,
    unread: state.unread,
    setOpen,
    toggleMax,
    switchTab
  };
};
