import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';

interface BaseChartProps {
  option: any;
  className?: string;
  style?: React.CSSProperties;
}

const normalizeSeries = (inputSeries: any) => {
  if (!inputSeries) return inputSeries;
  if (!Array.isArray(inputSeries)) return inputSeries;

  return inputSeries.map((series) => {
    if (!series || typeof series !== 'object') return series;
    const next = { ...series };
    const type = next.type;

    if (type === 'line') {
      next.smooth = next.smooth ?? true;
      next.symbol = next.symbol ?? 'circle';
      next.symbolSize = next.symbolSize ?? 5;
      next.lineStyle = {
        cap: 'round',
        join: 'round',
        width: 2,
        ...(next.lineStyle || {}),
      };
      if (next.areaStyle) {
        next.areaStyle = {
          opacity: 0.2,
          ...(next.areaStyle || {}),
        };
      }
    }

    if (type === 'bar') {
      next.barMinHeight = next.barMinHeight ?? 2;
      next.itemStyle = {
        borderRadius: 6,
        ...(next.itemStyle || {}),
      };
    }

    if (type === 'pie') {
      next.itemStyle = {
        borderRadius: 8,
        ...(next.itemStyle || {}),
      };
      if (next.labelLine) {
        next.labelLine = {
          smooth: true,
          ...(next.labelLine || {}),
        };
      }
    }

    if (type === 'radar') {
      next.lineStyle = {
        cap: 'round',
        join: 'round',
        ...(next.lineStyle || {}),
      };
      if (next.areaStyle) {
        next.areaStyle = {
          opacity: 0.22,
          ...(next.areaStyle || {}),
        };
      }
    }

    return next;
  });
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d+(\.\d+)?)/);
    if (match) return Number(match[1]);
  }
  return null;
};

const estimateLegendHeight = (legend: any, series: any): number => {
  if (!legend) return 0;
  const legendData: string[] =
    Array.isArray(legend.data) && legend.data.length > 0
      ? legend.data
      : Array.isArray(series)
      ? series.map((s: any) => s?.name).filter(Boolean)
      : [];

  const count = Math.max(legendData.length, 1);
  const rows = Math.max(1, Math.ceil(count / 4));
  const topPad = 10;
  const rowHeight = 18;
  const bottomGap = 10;
  return topPad + rows * rowHeight + bottomGap;
};

const withLegendSafeLayout = (option: any) => {
  if (!option.legend) return option;
  const next = { ...option };
  const reserveTop = estimateLegendHeight(option.legend, option.series);

  if (next.grid) {
    if (Array.isArray(next.grid)) {
      next.grid = next.grid.map((g: any) => {
        const gridTop = toNumber(g?.top);
        return {
          ...g,
          top: Math.max(gridTop ?? 0, reserveTop),
        };
      });
    } else {
      const gridTop = toNumber(next.grid.top);
      next.grid = {
        ...next.grid,
        top: Math.max(gridTop ?? 0, reserveTop),
      };
    }
  }

  if (Array.isArray(next.series)) {
    const centerYOffset = Math.min(18, Math.max(8, reserveTop - 30));
    next.series = next.series.map((s: any) => {
      if (!s || s.type !== 'pie') return s;
      const currentCenter = Array.isArray(s.center) ? s.center : ['50%', '50%'];
      const currentY = toNumber(currentCenter[1]) ?? 50;
      const nextY = Math.max(currentY, 50 + centerYOffset);
      return {
        ...s,
        center: [currentCenter[0], `${nextY}%`],
      };
    });
  }

  return next;
};

const mergeLegend = (legend: any) => {
  const applyDefault = (item: any) => ({
    ...item,
    textStyle: {
      color: '#d9eeff',
      fontSize: 11,
      ...(item?.textStyle || {}),
    },
    itemWidth: item?.itemWidth ?? 14,
    itemHeight: item?.itemHeight ?? 10,
    itemGap: item?.itemGap ?? 12,
  });

  if (!legend) return legend;
  if (Array.isArray(legend)) return legend.map((item) => applyDefault(item));
  return applyDefault(legend);
};

export const BaseChart: React.FC<BaseChartProps> = ({ option, className, style }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Common dark theme configurations
  const defaultGrid = {
    top: 30,
    bottom: 20,
    left: 30,
    right: 20,
    containLabel: true,
  };

  const defaultTooltip = {
    trigger: 'axis',
    backgroundColor: 'rgba(6, 20, 40, 0.96)',
    borderColor: '#0d3060',
    textStyle: {
      color: '#d4eeff',
      fontSize: 12,
    },
  };

  const defaultXAxis = {
    axisLine: { lineStyle: { color: 'rgba(74, 111, 165, 0.65)' } },
    axisLabel: { color: '#90c4e8', fontSize: 10 },
    nameTextStyle: { color: '#d4eeff', fontSize: 10, fontWeight: 500, padding: [0, 0, 0, 0] },
    axisTick: { show: false },
    splitLine: { show: false },
  };

  const defaultYAxis = {
    axisLine: { show: false },
    axisLabel: { color: '#90c4e8', fontSize: 10 },
    nameTextStyle: { color: '#d4eeff', fontSize: 10, fontWeight: 500, padding: [0, 0, 0, 0] },
    axisTick: { show: false },
    splitLine: { 
      show: true, 
      lineStyle: { color: 'rgba(74, 111, 165, 0.5)', type: 'dashed' } 
    },
  };

  const mergeAxis = (defaultAxis: any, customAxis: any) => {
    if (!customAxis) return undefined;
    if (Array.isArray(customAxis)) {
      return customAxis.map(axis => ({ ...defaultAxis, ...axis }));
    }
    return { ...defaultAxis, ...customAxis };
  };

  const finalOption = useMemo(() => {
    const merged: any = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'sans-serif',
      },
      ...option,
      grid: { ...defaultGrid, ...option.grid },
      tooltip: { ...defaultTooltip, ...option.tooltip },
      legend: mergeLegend(option.legend),
      animationDuration: option.animationDuration ?? 520,
      animationDurationUpdate: option.animationDurationUpdate ?? 420,
      animationEasing: option.animationEasing ?? 'cubicOut',
      animationEasingUpdate: option.animationEasingUpdate ?? 'cubicOut',
    };

    if (option.xAxis) {
      merged.xAxis = mergeAxis(defaultXAxis, option.xAxis);
    }
    if (option.yAxis) {
      merged.yAxis = mergeAxis(defaultYAxis, option.yAxis);
    }
    if (option.series) {
      merged.series = normalizeSeries(option.series);
    }
    return withLegendSafeLayout(merged);
  }, [option]);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    // Resize handling (兼容无 ResizeObserver 的环境，避免运行时崩溃)
    let resizeObserver: ResizeObserver | null = null;
    const handleWindowResize = () => chartInstance.current?.resize();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        chartInstance.current?.resize();
      });
      resizeObserver.observe(chartRef.current);
    } else {
      window.addEventListener('resize', handleWindowResize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleWindowResize);
      }
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;
    // 仅更新配置，不销毁实例，减少切换闪烁与变形
    chartInstance.current.setOption(finalOption, {
      notMerge: true,
      lazyUpdate: true,
    });
  }, [finalOption]);

  return <div ref={chartRef} className={`w-full h-full ${className || ''}`} style={style} />;
};
