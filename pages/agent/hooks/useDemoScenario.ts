import { useAIDock } from '../store/aidock';

export const useDemoScenario = () => {
  const {
    state,
    toggleMax,
    setHealth,
    triggerFault,
    setCustomer,
    setModelMode,
    runDiagnosis,
    createTicket,
    advanceTicket,
    resetDemo,
    appendMessage,
    switchTab
  } = useAIDock();

  return {
    healthMode: state.healthMode,
    customer: state.customer,
    modelMode: state.modelMode,
    maximized: state.maximized,
    tickets: state.tickets,
    toggleMax,
    setHealth,
    triggerFault,
    setCustomer,
    setModelMode,
    runDiagnosis,
    createTicket,
    advanceTicket,
    resetDemo,
    appendMessage,
    switchTab
  };
};
