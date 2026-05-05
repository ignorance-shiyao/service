import React, { useMemo, useState } from 'react';
import { BaseChart } from '../../../../../components/BaseChart';
import { ReportItem, ManagedBusiness } from '../../../../../mock/assistant';
import { BarChart3 } from 'lucide-react';
import { CardActionBar } from './CardActionBar';
import { getManagedBusinessStatus } from '../../store/metricSemantics';

interface ReportCardProps {
  report: ReportItem;
  businesses: ManagedBusiness[];
  onOpenHistory: () => void;
  onExport: (type: 'pdf' | 'image' | 'word') => void;
  onCopy?: (text: string) => void;
  onAsk?: (text: string) => void;
}

const metricClassName = (label: string) => {
  if (label.includes('在线') || label.includes('可用')) return 'border-[#4f9e88] bg-[rgba(21,111,96,0.44)] text-[#dcfff6]';
  if (label.includes('告警')) return 'border-[#ffb657] bg-[rgba(136,86,28,0.34)] text-[#ffe5bd]';
  if (label.includes('恢复')) return 'border-[#5b7ec8] bg-[rgba(45,78,144,0.46)] text-[#dde7ff]';
  return 'border-[#4c87bb] bg-[rgba(19,87,135,0.48)] text-[#d9efff]';
};

const getReportPosture = (report: ReportItem) => {
  const abnormal = report.serviceQuality?.filter((item) => item.status === '异常').length || 0;
  const watch = report.serviceQuality?.filter((item) => item.status === '关注').length || 0;
  const highRisks = report.risks?.filter((item) => item.level === '高').length || 0;
  if (abnormal > 0 || highRisks > 0) return { label: '需立即处置', tone: 'danger', score: 'B' };
  if (watch > 0 || (report.risks?.length || 0) > 0) return { label: '整体稳定，需跟踪', tone: 'warning', score: 'A-' };
  return { label: '运行健康', tone: 'normal', score: 'A' };
};

const postureClassName = (tone: string) => {
  if (tone === 'danger') return 'border-[#ff7d91] bg-[rgba(151,42,67,0.28)] text-[#ffd5dd]';
  if (tone === 'warning') return 'border-[#ffb657] bg-[rgba(151,91,24,0.26)] text-[#ffe4ba]';
  return 'border-[#4f9e88] bg-[rgba(23,109,102,0.34)] text-[#d6fff6]';
};

const buildReportCopyText = (report: ReportItem) => {
  const posture = getReportPosture(report);
  const lines = [
    report.title,
    '',
    `报告结论：${posture.score}｜${posture.label}`,
    `总体摘要：${report.summary}`,
    '',
    '一、核心指标',
    ...report.metrics.map((item, index) => `${index + 1}. ${item.label}：${item.value}`),
  ];

  if (report.sections?.length) {
    lines.push('', '二、运行概述');
    report.sections.forEach((section) => {
      lines.push(`${section.title}：`, ...section.items.map((item) => `（${section.items.indexOf(item) + 1}）${item}`));
    });
  }

  if (report.serviceQuality?.length) {
    lines.push('', '三、业务质量明细');
    report.serviceQuality.forEach((item) => {
      lines.push(`${item.name}：状态${item.status}，可用性${item.availability}，时延${item.latency}，丢包${item.loss}。说明：${item.note}`);
    });
  }

  if (report.risks?.length) {
    lines.push('', '四、风险与影响');
    report.risks.forEach((item) => {
      lines.push(`${item.level}风险：${item.title}。${item.detail} 责任部门/责任人：${item.owner}，计划期限：${item.due}`);
    });
  }

  if (report.tickets?.length) {
    lines.push('', '五、服务闭环', ...report.tickets.map((item) => `${item.label}：${item.value}，${item.note}`));
  }

  if (report.capacity?.length) {
    lines.push('', '六、容量与资源', ...report.capacity.map((item) => `${item.label}：${item.value}，${item.note}`));
  }

  if (report.events.length) {
    lines.push('', '七、关键事件', ...report.events.map((item) => `${item.time}：${item.text}`));
  }

  if (report.suggestions.length) {
    lines.push('', '八、后续建议', ...report.suggestions.map((item, index) => `${index + 1}. ${item}`));
  }

  if (report.nextActions?.length) {
    lines.push('', '九、行动计划');
    report.nextActions.forEach((item) => {
      lines.push(`${item.priority}：${item.action}。责任部门/责任人：${item.owner}，完成期限：${item.due}`);
    });
  }

  return lines.join('\n');
};

const businessStatusText = (status: ReturnType<typeof getManagedBusinessStatus>) => {
  if (status === 'danger') return '明显异常';
  if (status === 'warning') return '需关注';
  return '正常';
};

const WordSection: React.FC<{ index: string; title: string; children: React.ReactNode }> = ({ index, title, children }) => (
  <section className="mt-5">
    <h3 className="border-b border-[#b9cbe0] pb-1 text-[15px] font-bold text-[#123d68]">
      {index} {title}
    </h3>
    <div className="mt-2 text-[12px] leading-6 text-[#27364a]">{children}</div>
  </section>
);

const WordTable: React.FC<{ headers: string[]; rows: Array<Array<React.ReactNode>> }> = ({ headers, rows }) => (
  <div className="mt-2 overflow-x-auto">
    <table className="w-full border-collapse text-left text-[11px] leading-5 text-[#243247]">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} className="border border-[#b9c8d8] bg-[#edf3f8] px-2 py-1.5 font-semibold text-[#22435f]">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#fafcff]'}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border border-[#bdcad8] px-2 py-1.5 align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ReportCard: React.FC<ReportCardProps> = ({ report, businesses, onOpenHistory, onExport, onCopy, onAsk }) => {
  const [expanded, setExpanded] = useState(false);
  const copyText = useMemo(() => buildReportCopyText(report), [report]);
  const posture = useMemo(() => getReportPosture(report), [report]);
  const normalQualityCount = report.serviceQuality?.filter((item) => item.status === '正常').length || 0;
  const watchQualityCount = report.serviceQuality?.filter((item) => item.status !== '正常').length || 0;
  const riskCount = report.risks?.length || 0;
  const actionCount = report.nextActions?.length || 0;

  const option = useMemo(() => ({
    legend: { top: 0, data: ['本期', '上期', '同期'] },
    grid: { top: 26, left: 22, right: 12, bottom: 20 },
    xAxis: { type: 'category', data: report.trend.map((i) => i.day) },
    yAxis: { type: 'value' },
    series: [
      { name: '本期', type: 'line', data: report.trend.map((i) => Number(i.current.toFixed(2))), lineStyle: { color: '#34d3ff' } },
      { name: '上期', type: 'line', data: report.trend.map((i) => Number(i.prev.toFixed(2))), lineStyle: { color: '#79b2ff' } },
      { name: '同期', type: 'line', data: report.trend.map((i) => Number(i.yoy.toFixed(2))), lineStyle: { color: '#9f7dff' } },
    ],
  }), [report]);

  return (
    <div className="rounded-xl border border-[#4f7ec0] bg-[linear-gradient(145deg,rgba(36,79,139,0.98),rgba(18,58,105,0.98))] p-4 shadow-[0_12px_24px_rgba(8,33,71,0.32)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#edf7ff]">
          <BarChart3 size={16} className="text-[#96ddff]" />
          {report.title}
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${postureClassName(posture.tone)}`}>{posture.score} · {posture.label}</span>
      </div>
      <p className="mt-1 text-xs text-[#d3e8f9]">{report.summary}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#5f91c9] bg-[rgba(13,55,103,0.42)] px-2 py-1.5 text-[11px] text-[#dcefff]">
          <div className="text-[10px] text-[#9fbfda]">质量状态</div>
          <strong>{normalQualityCount} 正常 / {watchQualityCount} 关注</strong>
        </div>
        <div className="rounded-lg border border-[#5f91c9] bg-[rgba(13,55,103,0.42)] px-2 py-1.5 text-[11px] text-[#dcefff]">
          <div className="text-[10px] text-[#9fbfda]">风险项</div>
          <strong>{riskCount} 项待跟踪</strong>
        </div>
        <div className="rounded-lg border border-[#5f91c9] bg-[rgba(13,55,103,0.42)] px-2 py-1.5 text-[11px] text-[#dcefff]">
          <div className="text-[10px] text-[#9fbfda]">行动闭环</div>
          <strong>{actionCount} 项计划</strong>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {report.metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded border px-2 py-1 text-[11px] shadow-[inset_0_1px_0_rgba(189,230,255,0.15)] ${metricClassName(m.label)}`}
          >
            <span className="text-[#a8c8e6]">{m.label}</span>
            <div className="font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
      <CardActionBar
        actions={[
          {
            key: 'copy',
            label: '保存这段',
            onClick: () => onCopy?.(copyText),
          },
          {
            key: 'ask',
            label: '生成解读',
            onClick: () => onAsk?.(`请解读《${report.title}》，给出重点结论和建议`),
          },
          {
            key: 'expand',
            label: expanded ? '收起' : '看详细的',
            tone: 'primary',
            onClick: () => setExpanded((v) => !v),
          },
          {
            key: 'history',
            label: '历史报告',
            onClick: onOpenHistory,
          },
        ]}
      />

      {expanded && (
        <div className="mt-3 border-t border-[#5a84be] pt-3">
          <div className="rounded-lg border border-[rgba(139,179,215,0.42)] bg-[linear-gradient(180deg,rgba(231,239,247,0.72),rgba(215,226,238,0.66))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <article className="mx-auto max-h-[680px] overflow-auto rounded border border-[#d8e1ea] bg-[#ffffff] px-5 py-6 text-[#1f2937] shadow-[0_10px_22px_rgba(12,37,66,0.18)]">
              <header className="border-b border-[#c7d4e2] pb-4 text-center">
                <h2 className="text-[21px] font-bold tracking-wide text-[#0f2f57]">{report.title}</h2>
                <div className="mt-2 text-[11px] text-[#5b6778]">报告类型：运行分析报告 · 展示形态：Word 预览稿</div>
                <div className="mt-1 text-[11px] text-[#5b6778]">综合判断：{posture.score}｜{posture.label}</div>
              </header>

              <div className="mt-4 rounded border border-[#c5d3e2] bg-[#f7fafd] p-3 text-[12px] leading-6 text-[#26384f]">
                <div className="font-semibold text-[#0f4c81]">报告摘要</div>
                <p className="mt-1">{report.summary}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded border border-[#c8d6e6] bg-white px-2 py-1">
                    <span className="text-[#687789]">质量状态：</span>
                    <strong>{normalQualityCount} 正常 / {watchQualityCount} 关注</strong>
                  </div>
                  <div className="rounded border border-[#c8d6e6] bg-white px-2 py-1">
                    <span className="text-[#687789]">风险项：</span>
                    <strong>{riskCount} 项</strong>
                  </div>
                  <div className="rounded border border-[#c8d6e6] bg-white px-2 py-1">
                    <span className="text-[#687789]">行动计划：</span>
                    <strong>{actionCount} 项</strong>
                  </div>
                </div>
              </div>

              <WordSection index="一、" title="核心指标">
                <WordTable headers={['指标', '数值']} rows={report.metrics.map((item) => [item.label, item.value])} />
              </WordSection>

              {!!report.sections?.length && (
                <WordSection index="二、" title="运行概述">
                  {report.sections.map((section) => (
                    <div key={section.title} className="mb-3">
                      <div className="font-semibold text-[#1f4f7a]">{section.title}</div>
                      <ol className="mt-1 list-decimal space-y-1 pl-5">
                        {section.items.map((item) => <li key={item}>{item}</li>)}
                      </ol>
                    </div>
                  ))}
                </WordSection>
              )}

              <WordSection index="三、" title="业务运行概览">
                <WordTable
                  headers={['业务名称', '状态判断', '在线率', '时延', '丢包']}
                  rows={businesses.map((business) => {
                    const status = getManagedBusinessStatus(business);
                    return [
                      business.name,
                      businessStatusText(status),
                      `${business.onlineRate.toFixed(2)}%`,
                      `${business.latency}ms`,
                      `${business.loss}%`,
                    ];
                  })}
                />
              </WordSection>

              {!!report.serviceQuality?.length && (
                <WordSection index="四、" title="业务质量明细">
                  <WordTable
                    headers={['业务', '状态', '可用性', '时延', '丢包', '说明']}
                    rows={report.serviceQuality.map((item) => [item.name, item.status, item.availability, item.latency, item.loss, item.note])}
                  />
                </WordSection>
              )}

              {!!report.risks?.length && (
                <WordSection index="五、" title="风险与影响">
                  <WordTable
                    headers={['风险等级', '风险项', '影响说明', '责任部门/责任人', '计划期限']}
                    rows={report.risks.map((item) => [item.level, item.title, item.detail, item.owner, item.due])}
                  />
                </WordSection>
              )}

              {!!report.tickets?.length && (
                <WordSection index="六、" title="服务闭环">
                  <WordTable headers={['事项', '结果', '说明']} rows={report.tickets.map((item) => [item.label, item.value, item.note])} />
                </WordSection>
              )}

              {!!report.capacity?.length && (
                <WordSection index="七、" title="容量与资源">
                  <WordTable headers={['资源项', '状态/数值', '说明']} rows={report.capacity.map((item) => [item.label, item.value, item.note])} />
                </WordSection>
              )}

              <WordSection index="八、" title="关键事件">
                <WordTable headers={['时间', '事件说明']} rows={report.events.map((item) => [item.time, item.text])} />
              </WordSection>

              <WordSection index="九、" title="趋势对比">
                <div className="h-[170px] rounded border border-[#bccbdd] bg-[#f9fbfe] p-2">
                  <BaseChart option={option} />
                </div>
              </WordSection>

              <WordSection index="十、" title="后续建议">
                <ol className="list-decimal space-y-1 pl-5">
                  {report.suggestions.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </WordSection>

              {!!report.nextActions?.length && (
                <WordSection index="十一、" title="行动计划">
                  <WordTable
                    headers={['优先级', '行动项', '责任部门/责任人', '完成期限']}
                    rows={report.nextActions.map((item) => [item.priority, item.action, item.owner, item.due])}
                  />
                </WordSection>
              )}

              <footer className="mt-6 border-t border-[#d3dee9] pt-2 text-right text-[10px] text-[#6b7280]">
                由运维管家智能体生成，提交前建议结合客户现场反馈进行人工确认。
              </footer>
            </article>

            <div className="mt-3">
              <CardActionBar
                actions={[
                  { key: 'word', label: '导出 Word', tone: 'primary', onClick: () => onExport('word') },
                  { key: 'pdf', label: '导出 PDF', onClick: () => onExport('pdf') },
                  { key: 'image', label: '导出长图', onClick: () => onExport('image') },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
