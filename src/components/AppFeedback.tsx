import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ToastTone = 'success' | 'info' | 'warning' | 'error';

type ToastPayload = {
  id: string;
  message: string;
  title?: string;
  tone?: ToastTone;
  duration?: number;
};

type ConfirmPayload = {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ToastTone;
};

const TOAST_EVENT = 'app:toast';
const CONFIRM_EVENT = 'app:confirm';
const RESOLVE_EVENT = 'app:confirm-resolve';

const createFeedbackId = () => `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const showAppToast = (
  message: string,
  options: { title?: string; tone?: ToastTone; duration?: number } = {}
) => {
  if (typeof window === 'undefined') return;
  const payload: ToastPayload = {
    id: createFeedbackId(),
    message,
    title: options.title,
    tone: options.tone || 'info',
    duration: options.duration ?? 2800,
  };
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
};

export const confirmApp = (options: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ToastTone;
}) => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const id = createFeedbackId();
  const payload: ConfirmPayload = {
    id,
    title: options.title,
    message: options.message,
    confirmText: options.confirmText,
    cancelText: options.cancelText,
    tone: options.tone || 'warning',
  };
  return new Promise<boolean>((resolve) => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ id: string; confirmed: boolean }>;
      if (custom.detail?.id !== id) return;
      window.removeEventListener(RESOLVE_EVENT, handler as EventListener);
      resolve(!!custom.detail.confirmed);
    };
    window.addEventListener(RESOLVE_EVENT, handler as EventListener);
    window.dispatchEvent(new CustomEvent<ConfirmPayload>(CONFIRM_EVENT, { detail: payload }));
  });
};

const toneClass = (tone: ToastTone) => {
  if (tone === 'success') return 'border-[#2f9270] bg-[#0f3f38] text-[#d7fff2]';
  if (tone === 'warning') return 'border-[#a97c37] bg-[#4f3b1d] text-[#fff2da]';
  if (tone === 'error') return 'border-[#a75062] bg-[#4f2230] text-[#ffe0e5]';
  return 'border-[#3f78ab] bg-[#153f6d] text-[#dff2ff]';
};

const toneIcon = (tone: ToastTone) => {
  if (tone === 'success') return <CheckCircle2 size={15} className="text-[#57e0b2]" />;
  if (tone === 'warning') return <TriangleAlert size={15} className="text-[#ffd38a]" />;
  if (tone === 'error') return <AlertCircle size={15} className="text-[#ff9fb0]" />;
  return <Info size={15} className="text-[#79c5ff]" />;
};

export const AppFeedbackHost: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  const [queue, setQueue] = useState<ConfirmPayload[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onToast = (event: Event) => {
      const payload = (event as CustomEvent<ToastPayload>).detail;
      if (!payload?.id) return;
      setToasts((prev) => [...prev, payload]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== payload.id));
      }, payload.duration ?? 2800);
    };
    const onConfirm = (event: Event) => {
      const payload = (event as CustomEvent<ConfirmPayload>).detail;
      if (!payload?.id) return;
      setQueue((prev) => [...prev, payload]);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(CONFIRM_EVENT, onConfirm);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(CONFIRM_EVENT, onConfirm);
    };
  }, []);

  const currentConfirm = queue[0];

  const closeConfirm = (confirmed: boolean) => {
    if (typeof window !== 'undefined' && currentConfirm?.id) {
      window.dispatchEvent(
        new CustomEvent(RESOLVE_EVENT, {
          detail: { id: currentConfirm.id, confirmed },
        })
      );
    }
    setQueue((prev) => prev.slice(1));
  };

  const confirmTone = useMemo<ToastTone>(() => currentConfirm?.tone || 'warning', [currentConfirm]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="pointer-events-none fixed left-1/2 top-3 z-[4200] flex w-[min(92vw,560px)] -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-[0_10px_24px_rgba(2,14,35,0.35)] ${toneClass(toast.tone || 'info')}`}
          >
            <div className="mt-0.5 shrink-0">{toneIcon(toast.tone || 'info')}</div>
            <div className="min-w-0 flex-1">
              {toast.title && <div className="text-xs font-semibold">{toast.title}</div>}
              <div className="text-xs leading-5">{toast.message}</div>
            </div>
            <button
              type="button"
              className="rounded p-0.5 text-current/70 hover:bg-white/10 hover:text-current"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {currentConfirm && (
        <div className="fixed inset-0 z-[4100] flex items-center justify-center bg-[rgba(2,14,35,0.62)] p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-[420px] rounded-xl border border-[#2f6498] bg-[linear-gradient(180deg,#0f3a69_0%,#0a2f5a_100%)] shadow-[0_18px_40px_rgba(2,13,35,0.55)]">
            <div className="border-b border-[#275887] px-4 py-3 text-sm font-semibold text-[#e8f6ff]">
              {currentConfirm.title || '确认操作'}
            </div>
            <div className="flex items-start gap-2.5 px-4 py-4">
              <div className="mt-0.5">{toneIcon(confirmTone)}</div>
              <div className="text-sm leading-6 text-[#cfe7fb]">{currentConfirm.message}</div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#275887] px-4 py-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#4d84b8] bg-[#1a4b7d] px-4 text-sm font-medium text-[#d9efff] transition hover:border-[#66a3dd] hover:bg-[#1f5c95]"
              >
                {currentConfirm.cancelText || '取消'}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#63b9ff] bg-[#2f7fd9] px-4 text-sm font-semibold text-white transition hover:bg-[#3f8fe8]"
              >
                {currentConfirm.confirmText || '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
