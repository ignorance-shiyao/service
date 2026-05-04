export const formatRelativeTime = (
  input: number | string | Date,
  options?: { fallback?: string; locale?: string }
): string => {
  const fallback = options?.fallback || '刚刚';
  const locale = options?.locale || 'zh-CN';
  const parsed = input instanceof Date ? input : new Date(input);
  const ts = parsed.getTime();

  if (Number.isNaN(ts)) return typeof input === 'string' ? input : fallback;

  const diffMs = Date.now() - ts;
  if (diffMs < 0) return parsed.toLocaleString(locale, { hour12: false });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '刚刚';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} 分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} 小时前`;
  if (diffMs < day * 2) {
    return `昨天 ${parsed.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  if (diffMs < day * 7) {
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${weekNames[parsed.getDay()]} ${parsed.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }

  return parsed.toLocaleDateString(locale);
};
