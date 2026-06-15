import React, { useEffect, useMemo, useState } from 'react';
import { Box, Database, Layers3, MapPinned, DoorOpen, Flame, Droplets, Thermometer } from 'lucide-react';

type IdcManifest = {
  version: string;
  created: string;
  canvas: { width: number; height: number };
  excel_capacity: {
    rack_rows: Record<string, number>;
    rack_total: number;
    record_count: number;
  };
  files: Record<string, string>;
};

type PlacementRow = {
  id: string;
  component: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  note?: string;
};

type RackRow = {
  id: string;
  row: string;
  rack_count: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rack_numbers: string;
};

type RackSlot = {
  id: string;
  row: string;
  rack_no: number;
  parent_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ParsedRow = Record<string, string>;

const ASSET_BASE = '/svg/idc_0608_V1';
const BASE_MAP_SRC = '/svg/idc/room_base_empty_raw.svg';

const parseCsv = (csv: string): ParsedRow[] => {
  const rows: ParsedRow[] = [];
  const lines = csv.trim().split(/\r?\n/);
  if (!lines.length) return rows;

  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        cells.push(current);
        current = '';
        continue;
      }
      current += char;
    }

    cells.push(current);
    return cells;
  };

  const headers = splitLine(lines[0]);
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitLine(line);
    const row: ParsedRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
};

const toNumber = (value: string) => Number(value || 0);

const metricCardClass =
  'rounded border border-[#1b588f] bg-[linear-gradient(180deg,rgba(7,34,68,0.96),rgba(8,26,51,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

const panelClass =
  'rounded border border-[#1a4c7c] bg-[linear-gradient(180deg,rgba(5,24,48,0.94),rgba(4,17,34,0.95))] shadow-[0_0_24px_rgba(15,64,115,0.18)]';

const sectionTitle = (title: string, subtitle?: string) => (
  <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#173f69] pb-2">
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#e8f3ff]">
        <span className="text-[#4fb6ff]">|</span>
        <span>{title}</span>
      </div>
      {subtitle && <div className="mt-1 text-[11px] text-[#7fa5cb]">{subtitle}</div>}
    </div>
  </div>
);

export const IDCOverview: React.FC = () => {
  const [manifest, setManifest] = useState<IdcManifest | null>(null);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [rackRows, setRackRows] = useState<RackRow[]>([]);
  const [rackSlots, setRackSlots] = useState<RackSlot[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string>('row_A');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [manifestRes, placementsRes, rowsRes, slotsRes] = await Promise.all([
          fetch(`${ASSET_BASE}/manifest.json`, { signal: controller.signal }),
          fetch(`${ASSET_BASE}/placements_topdown.csv`, { signal: controller.signal }),
          fetch(`${ASSET_BASE}/rack_rows_AK.csv`, { signal: controller.signal }),
          fetch(`${ASSET_BASE}/rack_slots_AK.csv`, { signal: controller.signal }),
        ]);

        if (!manifestRes.ok || !placementsRes.ok || !rowsRes.ok || !slotsRes.ok) {
          throw new Error('IDC 资源加载失败');
        }

        const [manifestData, placementsCsv, rowsCsv, slotsCsv] = await Promise.all([
          manifestRes.json() as Promise<IdcManifest>,
          placementsRes.text(),
          rowsRes.text(),
          slotsRes.text(),
        ]);

        setManifest(manifestData);

        const placementRows = parseCsv(placementsCsv).map((row) => ({
          id: row.id,
          component: row.component,
          category: row.category,
          x: toNumber(row.x),
          y: toNumber(row.y),
          width: toNumber(row.width),
          height: toNumber(row.height),
          zIndex: toNumber(row.zIndex),
          note: row.note || undefined,
        }));

        const rackRowItems = parseCsv(rowsCsv).map((row) => ({
          id: row.id,
          row: row.row,
          rack_count: toNumber(row.rack_count),
          x: toNumber(row.x),
          y: toNumber(row.y),
          width: toNumber(row.width),
          height: toNumber(row.height),
          rack_numbers: row.rack_numbers,
        }));

        const rackSlotItems = parseCsv(slotsCsv).map((row) => ({
          id: row.id,
          row: row.row,
          rack_no: toNumber(row.rack_no),
          parent_id: row.parent_id,
          x: toNumber(row.x),
          y: toNumber(row.y),
          width: toNumber(row.width),
          height: toNumber(row.height),
        }));

        setPlacements(placementRows);
        setRackRows(rackRowItems);
        setRackSlots(rackSlotItems);
        setSelectedRowId((current) => {
          if (rackRowItems.some((item) => item.id === current)) return current;
          return rackRowItems[0]?.id ?? 'row_A';
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : '未知错误');
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const rowSource = manifest?.excel_capacity.rack_rows ?? {};
  const selectedRow = useMemo(() => rackRows.find((row) => row.id === selectedRowId) ?? rackRows[0] ?? null, [rackRows, selectedRowId]);
  const selectedSlots = useMemo(
    () => (selectedRow ? rackSlots.filter((slot) => slot.parent_id === selectedRow.id).sort((a, b) => a.rack_no - b.rack_no) : []),
    [rackSlots, selectedRow],
  );
  const selectedRowRatio = selectedRow ? Math.round((selectedRow.rack_count / Math.max(...rackRows.map((row) => row.rack_count), 1)) * 100) : 0;
  const totalSlots = rackSlots.length;
  const facilityCount = placements.filter((item) => item.id !== 'rack_rows_AK_topdown_body').length;

  const sourceRows = useMemo(() => rackRows, [rackRows]);

  const currentFacility = placements.find((item) => item.id === 'rack_rows_AK_topdown_body');
  const canvasWidth = manifest?.canvas.width ?? 1920;
  const canvasHeight = manifest?.canvas.height ?? 1080;
  const toPctX = (value: number) => `${(value / canvasWidth) * 100}%`;
  const toPctY = (value: number) => `${(value / canvasHeight) * 100}%`;

  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-[#0c3d75] bg-[radial-gradient(ellipse_at_top,rgba(29,86,151,0.16),transparent_55%),linear-gradient(180deg,#02111f_0%,#030c19_100%)] p-1.5 text-slate-100">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3 rounded border border-[#0f3e74] bg-[linear-gradient(180deg,rgba(6,28,55,0.95),rgba(4,20,41,0.98))] px-3 py-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#e8f3ff]">
            <span className="text-[#4fb6ff]">|</span>
            <span>IDC 机房重建</span>
            <span className="rounded border border-[#1c5b97] bg-[#082342] px-2 py-0.5 text-[11px] text-[#8bc4ff]">
              {manifest?.version ?? 'idc_0608_V1'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#7fa5cb]">
            基于 `room_base_empty_raw.svg` + `rack_rows_AK_topdown_body_page.svg` + `placements_topdown.csv` + `rack_rows_AK.csv` + `rack_slots_AK.csv`
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {[
            { label: '机柜总量', value: manifest?.excel_capacity.rack_total ?? 196, icon: <Box size={12} /> },
            { label: '记录数', value: manifest?.excel_capacity.record_count ?? 332, icon: <Database size={12} /> },
            { label: '设施点位', value: facilityCount, icon: <MapPinned size={12} /> },
            { label: '槽位总数', value: totalSlots, icon: <Layers3 size={12} /> },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 rounded border border-[#1b588f] bg-[#072445] px-2.5 py-1.5 text-[#cfe9ff]">
              <span className="text-[#79d0ff]">{item.icon}</span>
              <span className="text-[#7fa5cb]">{item.label}</span>
              <span className="font-mono font-bold text-[#f1f8ff]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div className={`${panelClass} p-4 text-sm text-[#ff9d8f]`}>
          IDC 资源加载失败: {error}
        </div>
      ) : (
        <div className="grid min-h-[calc(100%-50px)] grid-cols-12 gap-1.5 xl:auto-rows-fr xl:grid-rows-[1fr_auto]">
          <div className={`${panelClass} col-span-12 xl:col-span-8 xl:row-span-2`}>
            {sectionTitle('机房总图', '底图、机柜总图和设施点位都按 manifest/CSV 的真实坐标渲染')}
            <div className="relative aspect-[1920/1080] w-full overflow-hidden rounded border border-[#17497a] bg-[#031125]">
              <img
                src={BASE_MAP_SRC}
                alt="IDC empty room base"
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                style={{ zIndex: 1 }}
              />

              <img
                src={`${ASSET_BASE}/rack_rows_AK_topdown_body_page.svg`}
                alt="AK rack rows"
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                style={{ zIndex: 20, opacity: 0.98 }}
              />

              {placements
                .filter((item) => item.id !== 'rack_rows_AK_topdown_body')
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="group absolute"
                    style={{
                      left: toPctX(item.x),
                      top: toPctY(item.y),
                      width: toPctX(item.width),
                      height: toPctY(item.height),
                      zIndex: item.zIndex + 40,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`${item.id}${item.note ? ` · ${item.note}` : ''}`}
                  >
                    <img
                      src={`${ASSET_BASE}/${item.component}`}
                      alt={item.id}
                      draggable={false}
                      className="h-full w-full select-none object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)] transition duration-200 group-hover:scale-[1.02]"
                    />
                    <div
                      className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 translate-y-1 rounded border border-[#265d93] bg-[#061f3d]/90 px-2 py-0.5 text-[10px] text-[#cfe9ff] opacity-90 shadow-[0_0_14px_rgba(79,193,255,0.1)]"
                    >
                      {item.note || item.id}
                    </div>
                  </button>
                ))}

              {rackRows.map((row) => {
                const isSelected = row.id === selectedRow?.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedRowId(row.id)}
                    className="absolute rounded"
                    style={{
                      left: toPctX(row.x),
                      top: toPctY(row.y),
                      width: toPctX(row.width),
                      height: toPctY(row.height),
                      zIndex: isSelected ? 95 : 55,
                      transform: 'translate(-50%, -50%)',
                      border: isSelected ? '1px solid rgba(79,193,255,0.95)' : '1px solid rgba(79,193,255,0.18)',
                      background: isSelected ? 'rgba(79,193,255,0.08)' : 'transparent',
                      boxShadow: isSelected ? '0 0 0 1px rgba(79,193,255,0.15), 0 0 18px rgba(79,193,255,0.16)' : undefined,
                    }}
                    title={`机柜列 ${row.row} · ${row.rack_count} 架`}
                  >
                    <div className="absolute left-0 top-0 rounded-br bg-[#061f3d]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[#e8f3ff]">
                      {row.row} / {row.rack_count}
                    </div>
                  </button>
                );
              })}

              {selectedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="absolute rounded border border-[#76d4ff] bg-[linear-gradient(180deg,rgba(79,193,255,0.18),rgba(12,50,89,0.72))] text-center font-mono text-[9px] text-[#dff5ff] shadow-[0_0_12px_rgba(79,193,255,0.16)]"
                  style={{
                    left: toPctX(slot.x),
                    top: toPctY(slot.y),
                    width: toPctX(slot.width),
                    height: toPctY(slot.height),
                    zIndex: 88,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`${slot.id} · ${slot.parent_id} · ${slot.rack_no}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center">{slot.rack_no}</span>
                </div>
              ))}

              <div className="absolute left-4 top-4 z-[120] flex items-center gap-2 rounded border border-[#1e5d99] bg-[#041a33]/90 px-3 py-1.5 text-[11px] text-[#cfe9ff] shadow-[0_0_18px_rgba(0,0,0,0.18)]">
                <span className="text-[#79d0ff]">
                  <DoorOpen size={12} />
                </span>
                <span>门禁 / 入口 / 灭火 / 配电 / 空调 / 传感器点位均按 placements_topdown.csv 渲染</span>
              </div>

              <div className="absolute bottom-4 left-4 z-[120] flex items-center gap-2 rounded border border-[#1e5d99] bg-[#041a33]/90 px-3 py-1.5 text-[11px] text-[#cfe9ff]">
                <span className="text-[#ffbb7a]">
                  <Flame size={12} />
                </span>
                <span className="text-[#79d0ff]">
                  <Droplets size={12} />
                </span>
                <span className="text-[#79d0ff]">
                  <Thermometer size={12} />
                </span>
                <span>业务绑定由 rack_rows_AK.csv 和 rack_slots_AK.csv 提供</span>
              </div>
            </div>
          </div>

          <div className={`${panelClass} col-span-12 xl:col-span-4`}>
            {sectionTitle('机柜列绑定', '点击左侧机柜列切换当前列，右侧同步显示该列的槽位和容量')}
            <div className="space-y-3">
              <div className={metricCardClass}>
                <div className="flex items-center justify-between text-[11px] text-[#7fa5cb]">
                  <span>当前列</span>
                  <span className="font-mono text-[#cfe9ff]">{selectedRow?.id ?? '-'}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2b6aa8] bg-[#0e3d79] text-[#79d0ff]">
                    <Box size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#e8f3ff]">
                      {selectedRow?.row ?? '-'} 列
                    </div>
                    <div className="mt-1 text-[11px] text-[#7fa5cb]">
                      规划 {selectedRow?.rack_count ?? 0} 架，源数据容量 {selectedRow ? rowSource[selectedRow.row] ?? selectedRow.rack_count : 0} 架
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#081b34]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#4fb6ff,#6ce09a)]"
                    style={{ width: `${selectedRowRatio}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#7fa5cb]">
                  <span>列容量比例</span>
                  <span className="font-mono text-[#cfe9ff]">{selectedRowRatio}%</span>
                </div>
              </div>

              <div className={metricCardClass}>
                <div className="mb-2 flex items-center justify-between text-[11px] text-[#7fa5cb]">
                  <span>槽位清单</span>
                  <span className="font-mono text-[#cfe9ff]">{selectedSlots.length} 个</span>
                </div>
                <div className="max-h-[18rem] overflow-auto pr-1">
                  <div className="grid grid-cols-6 gap-1.5">
                    {selectedSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="rounded border border-[#214f7e] bg-[#081f3c] px-1.5 py-1 text-center font-mono text-[10px] text-[#dff5ff]"
                        title={slot.id}
                      >
                        {slot.rack_no}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={metricCardClass}>
                <div className="mb-2 flex items-center justify-between text-[11px] text-[#7fa5cb]">
                  <span>机柜列分布</span>
                  <span className="font-mono text-[#cfe9ff]">A-K / 11 列</span>
                </div>
                <div className="space-y-1.5">
                  {sourceRows.map((row) => {
                    const isSelected = row.id === selectedRow?.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedRowId(row.id)}
                        className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left text-[11px] transition ${
                          isSelected
                            ? 'border-[#4fb6ff] bg-[#0f3d78]/80 text-[#e8f3ff]'
                            : 'border-[#163b61] bg-[#071d39] text-[#a9c8ee] hover:border-[#2f78d4] hover:bg-[#0b2548]'
                        }`}
                      >
                        <span className="w-7 font-mono font-semibold text-[#79d0ff]">{row.row}</span>
                        <span className="font-mono">{row.rack_count} 架</span>
                        <span className="ml-auto text-[#7fa5cb]">
                          {row.rack_numbers.split(',').slice(0, 3).join(',')}
                          {row.rack_numbers.split(',').length > 3 ? '…' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={`${panelClass} col-span-12 xl:col-span-8`}>
            {sectionTitle('数据来源', '这页直接绑定 manifest 和 CSV，不再用手写坐标兜底')}
            <div className="grid gap-2 md:grid-cols-3">
              <div className={metricCardClass}>
                <div className="text-[11px] text-[#7fa5cb]">manifest.json</div>
                <div className="mt-2 text-sm font-semibold text-[#e8f3ff]">{manifest?.version ?? 'idc_0608_V1'}</div>
                <div className="mt-1 text-[11px] text-[#7fa5cb]">
                  创建时间 {manifest?.created ?? '-'}
                </div>
              </div>
              <div className={metricCardClass}>
                <div className="text-[11px] text-[#7fa5cb]">room_base_empty_raw.svg</div>
                <div className="mt-2 text-sm font-semibold text-[#e8f3ff]">原始空机房底图</div>
                <div className="mt-1 text-[11px] text-[#7fa5cb]">
                  canvas {manifest?.canvas.width ?? 1672} × {manifest?.canvas.height ?? 941}
                </div>
              </div>
              <div className={metricCardClass}>
                <div className="text-[11px] text-[#7fa5cb]">rack_rows_AK_topdown_body_page.svg</div>
                <div className="mt-2 text-sm font-semibold text-[#e8f3ff]">A-K 俯视连续机柜排</div>
                <div className="mt-1 text-[11px] text-[#7fa5cb]">
                  selected row: {selectedRow?.row ?? '-'} / {selectedRow?.rack_count ?? 0} 架
                </div>
              </div>
            </div>
            {currentFacility && (
              <div className="mt-2 rounded border border-[#204d7b] bg-[#071c38] px-3 py-2 text-[11px] text-[#7fa5cb]">
                当前使用的全幅机柜层为 <span className="font-mono text-[#cfe9ff]">{currentFacility.component}</span>，加载层级由 manifest.files.preview / rack_body_page 统一定义。
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCOverview;
