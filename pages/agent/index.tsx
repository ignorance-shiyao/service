import React from 'react';
import { AIDockProvider, useAIDock } from './store/aidock';
import { FloatingBall } from './components/FloatingBall';
import { DockPanel } from './components/DockPanel';
import { DemoConsole } from './components/DemoConsole';

const AIDockInner: React.FC = () => {
  const { state, setOpen } = useAIDock();
  const healthText =
    state.healthMode === 'normal'
      ? '当前一切正常，您可以继续专注业务。'
      : state.healthMode === 'warning'
      ? '有 1 项需要关注，建议查看业务概览。'
      : '检测到 1 项故障，建议立即体检。';

  return (
    <>
      <FloatingBall unread={state.unread} healthText={healthText} onClick={() => setOpen(true)} />
      {state.open && <DockPanel />}
      {state.open && <DemoConsole />}
    </>
  );
};

const AIDock: React.FC = () => {
  return (
    <AIDockProvider>
      <AIDockInner />
    </AIDockProvider>
  );
};

export default AIDock;
