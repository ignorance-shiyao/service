import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, RotateCcw, Search, Settings2, X } from 'lucide-react';
import { BaseChart } from '../components/BaseChart';

type IDCPerformanceRow = {
  roomShortName: string;
  dynamicRoomName: string;
  deviceType: string;
  deviceSubType: string;
  monitorObject: string;
  monitorObjectCode: string;
  resourceDeviceName: string;
  number: string;
  province: string;
  provinceCode: string;
  city: string;
  cityCode: string;
  district: string;
  districtCode: string;
  standardRoomType: string;
  siteName: string;
  siteCode: string;
  siteType: string;
  resourceRoomName: string;
  resourceRoomCode: string;
  roomType: string;
  resourceDeviceCode: string;
  systemName: string;
  systemCode: string;
  ratedCapacity: string;
  parentNode: string;
  communicationStatus: string;
  alarmStatus: string;
  engineeringStatus: string;
  uploadedToGroup: string;
  deviceTypeCode: string;
  deviceSubTypeCode: string;
  manufacturer: string;
  runTime: string;
  fsuCode: string;
  fsuManufacturer: string;
  protocolVersion: string;
  projectNo: string;
  roomCode: string;
  fsuIp: string;
  monitorObjectStatus: string;
};

type DetailMode = 'realtime' | 'history';

type MonitorPoint = {
  name: string;
  code: string;
  signalType: string;
  metric: 'temperature' | 'power' | 'voltage' | 'current' | 'frequency' | 'factor';
  unit: string;
};

type PerformanceSample = MonitorPoint & {
  value: number;
  requestTime: string;
};

type HistorySample = PerformanceSample & {
  groupName: string;
};

const columns: Array<{ key: keyof IDCPerformanceRow | 'action'; label: string; width: string }> = [
  { key: 'roomShortName', label: '综资机房简称', width: '150px' },
  { key: 'dynamicRoomName', label: '动环机房名称', width: '210px' },
  { key: 'deviceType', label: '设备类型', width: '130px' },
  { key: 'deviceSubType', label: '设备子类型', width: '130px' },
  { key: 'monitorObject', label: '监控对象', width: '120px' },
  { key: 'monitorObjectCode', label: '监控对象编号', width: '160px' },
  { key: 'resourceDeviceName', label: '综资设备名称', width: '220px' },
  { key: 'number', label: '编号', width: '90px' },
  { key: 'province', label: '省份', width: '100px' },
  { key: 'provinceCode', label: '省份编码', width: '100px' },
  { key: 'city', label: '地市', width: '100px' },
  { key: 'cityCode', label: '地市编码', width: '120px' },
  { key: 'district', label: '区县', width: '100px' },
  { key: 'districtCode', label: '区县编码', width: '120px' },
  { key: 'standardRoomType', label: '机房标准化类型', width: '140px' },
  { key: 'siteName', label: '站址名称', width: '150px' },
  { key: 'siteCode', label: '站址编号', width: '140px' },
  { key: 'siteType', label: '站址类型', width: '120px' },
  { key: 'resourceRoomName', label: '综资机房名称', width: '210px' },
  { key: 'resourceRoomCode', label: '综资机房编号', width: '130px' },
  { key: 'roomType', label: '机房类型', width: '100px' },
  { key: 'resourceDeviceCode', label: '综资设备编号', width: '130px' },
  { key: 'systemName', label: '系统名称', width: '110px' },
  { key: 'systemCode', label: '系统编号', width: '170px' },
  { key: 'ratedCapacity', label: '额定容量', width: '100px' },
  { key: 'parentNode', label: '父节点', width: '120px' },
  { key: 'communicationStatus', label: '通信状态', width: '100px' },
  { key: 'alarmStatus', label: '告警状态', width: '100px' },
  { key: 'engineeringStatus', label: '工程状态', width: '100px' },
  { key: 'uploadedToGroup', label: '是否上传集团', width: '120px' },
  { key: 'deviceTypeCode', label: '设备类型编号', width: '120px' },
  { key: 'deviceSubTypeCode', label: '设备子类型编号', width: '130px' },
  { key: 'manufacturer', label: '设备厂家', width: '120px' },
  { key: 'runTime', label: '投入运行时间', width: '150px' },
  { key: 'fsuCode', label: '接入FSU编码', width: '150px' },
  { key: 'fsuManufacturer', label: '接入FSU厂家', width: '150px' },
  { key: 'protocolVersion', label: '协议版本号', width: '120px' },
  { key: 'projectNo', label: '项目号', width: '140px' },
  { key: 'roomCode', label: '机房编号', width: '150px' },
  { key: 'fsuIp', label: 'FSU IP', width: '120px' },
  { key: 'monitorObjectStatus', label: '监控对象状态', width: '130px' },
  { key: 'action', label: '操作', width: '160px' },
];
const deviceExportColumns = columns.filter(column => column.key !== 'action');

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const cabinetNumbers = Array.from({ length: 14 }, (_, index) => String(index + 1).padStart(2, '0'));
const metricDefinitions = [
  { suffix: '相触点温度', code: '96352', metric: 'temperature' as const, unit: '℃' },
  { suffix: '有功功率', code: '96340', metric: 'power' as const, unit: 'kW' },
  { suffix: '电压', code: '96330', metric: 'voltage' as const, unit: 'V' },
  { suffix: '电流', code: '96337', metric: 'current' as const, unit: 'A' },
];
const endBoxDefinitions = [
  { prefix: '南B路始端箱', suffix: '频率', code: '96307', metric: 'frequency' as const, unit: 'Hz' },
  { prefix: '南B路始端箱', suffix: '总功率因数', code: '96318', metric: 'factor' as const, unit: '' },
  { prefix: '南B路始端箱', suffix: '总有功功率', code: '96314', metric: 'power' as const, unit: 'kW' },
  { prefix: '南B路始端箱', suffix: 'A电压', code: '96301', metric: 'voltage' as const, unit: 'V' },
  { prefix: '南B路始端箱', suffix: 'A电流', code: '96308', metric: 'current' as const, unit: 'A' },
  { prefix: '北A路始端箱', suffix: '频率', code: '96307', metric: 'frequency' as const, unit: 'Hz' },
  { prefix: '北A路始端箱', suffix: '总功率因数', code: '96318', metric: 'factor' as const, unit: '' },
  { prefix: '北A路始端箱', suffix: '总有功功率', code: '96314', metric: 'power' as const, unit: 'kW' },
  { prefix: '北A路始端箱', suffix: 'A电压', code: '96301', metric: 'voltage' as const, unit: 'V' },
  { prefix: '北A路始端箱', suffix: 'A电流', code: '96308', metric: 'current' as const, unit: 'A' },
];

const pad = (value: number) => String(value).padStart(2, '0');
const formatDateTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

const toDateTimeInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const getRecentThreeDaysRange = () => {
  const end = new Date();
  end.setSeconds(0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 3);
  return {
    start: toDateTimeInput(start),
    end: toDateTimeInput(end),
  };
};

const rows: IDCPerformanceRow[] = Array.from({ length: 53 }, (_, index) => {
  const floor = 2 + (index % 4);
  const room = `0${floor}F${String(201 + (index % 6)).padStart(3, '0')}-IDC业务机房`;
  const cabinet = `${letters[index % letters.length]}列小母排`;
  const vendor = `设备厂家${String.fromCharCode(65 + (index % 4))}`;
  const fsuVendor = `FSU厂家${String.fromCharCode(65 + (index % 3))}`;
  const deviceNo = 1 + (index % 12);

  return {
    roomShortName: room,
    dynamicRoomName: `某市核心数据中心${room}`,
    deviceType: '交流母线配电',
    deviceSubType: '交流母线配电',
    monitorObject: cabinet,
    monitorObjectCode: `960100${String(14000000 + index * 37).padStart(8, '0')}`,
    resourceDeviceName: `某市核心数据中心${room}-UPS输出列头柜-${deviceNo}`,
    number: String(120 + index * 17),
    province: '某省',
    provinceCode: '00',
    city: '某市',
    cityCode: '000100',
    district: '某区',
    districtCode: '000101',
    standardRoomType: '数据中心',
    siteName: '某市核心数据中心',
    siteCode: `100000${String(8000 + index)}`,
    siteType: '数据中心',
    resourceRoomName: `某市核心数据中心${room}`,
    resourceRoomCode: `DC-${String(410000 + index).padStart(6, '0')}`,
    roomType: 'IDC机房',
    resourceDeviceCode: `RD-${String(10012000 + index)}`,
    systemName: '动环监控系统',
    systemCode: `SYS-${String(830000 + index)}`,
    ratedCapacity: `${120 + (index % 6) * 20}kVA`,
    parentNode: `${1 + (index % 3)}#汇聚FSU`,
    communicationStatus: index % 19 === 0 ? '离线' : '在线',
    alarmStatus: index % 13 === 0 ? '一般告警' : '无告警',
    engineeringStatus: index % 17 === 0 ? '调测' : '在网',
    uploadedToGroup: index % 8 === 0 ? '否' : '是',
    deviceTypeCode: '96',
    deviceSubTypeCode: '1',
    manufacturer: vendor,
    runTime: `2023-${String(4 + (index % 8)).padStart(2, '0')}-${String(1 + (index % 24)).padStart(2, '0')} 12:00:00`,
    fsuCode: `FSU-${String(202300000000 + index * 9)}`,
    fsuManufacturer: fsuVendor,
    protocolVersion: 'V2.0',
    projectNo: `PRJ-${String(10000 + index)}`,
    roomCode: `RM-${String(300000 + index)}`,
    fsuIp: `10.${20 + (index % 8)}.${10 + (index % 20)}.${100 + (index % 50)}`,
    monitorObjectStatus: index % 19 === 0 ? '待确认' : '正常',
  };
});

const getMonitorPoints = (row: IDCPerformanceRow): MonitorPoint[] => {
  const columnPrefix = row.monitorObject.slice(0, 1) || 'I';
  const cabinetPoints = cabinetNumbers.flatMap(cabinetNo =>
    (['B', 'A'] as const).flatMap(route =>
      metricDefinitions.map(definition => ({
        name: `${columnPrefix}列${cabinetNo}机柜-${route}路${definition.suffix}`,
        code: definition.code,
        signalType: '遥测',
        metric: definition.metric,
        unit: definition.unit,
      }))
    )
  );

  const endBoxPoints = endBoxDefinitions.map(definition => ({
    name: `${definition.prefix}-${definition.suffix}`,
    code: definition.code,
    signalType: '遥测',
    metric: definition.metric,
    unit: definition.unit,
  }));

  return [...cabinetPoints, ...endBoxPoints];
};

const metricBaseValue: Record<MonitorPoint['metric'], number> = {
  temperature: 26.4,
  power: 1.6,
  voltage: 220.2,
  current: 7.8,
  frequency: 50,
  factor: 1.03,
};

const metricAmplitude: Record<MonitorPoint['metric'], number> = {
  temperature: 0.9,
  power: 0.55,
  voltage: 1.4,
  current: 2.8,
  frequency: 0.08,
  factor: 0.04,
};

const getPerformanceValue = (row: IDCPerformanceRow, point: MonitorPoint, date: Date) => {
  const seed = Number(row.number) + Number(point.code) + date.getTime() / 900000;
  const wave = Math.sin(seed * 0.47) * metricAmplitude[point.metric];
  const drift = Math.cos(seed * 0.13) * metricAmplitude[point.metric] * 0.35;
  const cabinetMatch = point.name.match(/(\d{2})机柜/);
  const cabinetOffset = cabinetMatch ? (Number(cabinetMatch[1]) - 7) * 0.06 : 0;
  const value = metricBaseValue[point.metric] + wave + drift + cabinetOffset;

  if (point.metric === 'factor') return Number(Math.min(1.08, Math.max(0.92, value)).toFixed(2));
  if (point.metric === 'frequency') return Number(value.toFixed(2));
  if (point.metric === 'voltage') return Number(value.toFixed(2));
  return Number(Math.max(0, value).toFixed(2));
};

const buildHistorySamples = (row: IDCPerformanceRow, point: MonitorPoint, start: string, end: string): PerformanceSample[] => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [];

  const samples: PerformanceSample[] = [];
  const cursor = new Date(startDate);
  cursor.setMinutes(Math.floor(cursor.getMinutes() / 15) * 15, 0, 0);

  while (cursor <= endDate && samples.length < 288) {
    samples.push({
      ...point,
      value: getPerformanceValue(row, point, cursor),
      requestTime: formatDateTime(cursor),
    });
    cursor.setMinutes(cursor.getMinutes() + 15);
  }

  return samples;
};

const buildRealtimeSamples = (row: IDCPerformanceRow, points: MonitorPoint[]): PerformanceSample[] => {
  const now = new Date();
  now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);
  return points.map(point => ({
    ...point,
    value: getPerformanceValue(row, point, now),
    requestTime: formatDateTime(now),
  }));
};

const buildRealtimeSamplesAtTime = (row: IDCPerformanceRow, points: MonitorPoint[], time: string): PerformanceSample[] => {
  const target = new Date(time);
  if (Number.isNaN(target.getTime())) return [];
  target.setMinutes(Math.floor(target.getMinutes() / 15) * 15, 0, 0);
  return points.map(point => ({
    ...point,
    value: getPerformanceValue(row, point, target),
    requestTime: formatDateTime(target),
  }));
};

const escapeCsvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const IDCPerformance: React.FC = () => {
  const [roomKeyword, setRoomKeyword] = useState('');
  const [deviceType, setDeviceType] = useState('交流母线配电');
  const [deviceName, setDeviceName] = useState('');
  const [monitorObject, setMonitorObject] = useState('');
  const [appliedRoomKeyword, setAppliedRoomKeyword] = useState('');
  const [appliedDeviceType, setAppliedDeviceType] = useState('交流母线配电');
  const [appliedDeviceName, setAppliedDeviceName] = useState('');
  const [appliedMonitorObject, setAppliedMonitorObject] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartTime, setExportStartTime] = useState(() => getRecentThreeDaysRange().start);
  const [exportEndTime, setExportEndTime] = useState(() => getRecentThreeDaysRange().end);
  const [detailMode, setDetailMode] = useState<DetailMode>('history');
  const [selectedRow, setSelectedRow] = useState<IDCPerformanceRow | null>(null);
  const [selectedPointNames, setSelectedPointNames] = useState<string[]>([]);
  const [pointSearchKeyword, setPointSearchKeyword] = useState('');
  const [realtimeSearchKeyword, setRealtimeSearchKeyword] = useState('');
  const [queryStartTime, setQueryStartTime] = useState(() => getRecentThreeDaysRange().start);
  const [queryEndTime, setQueryEndTime] = useState(() => getRecentThreeDaysRange().end);
  const [appliedStartTime, setAppliedStartTime] = useState(() => getRecentThreeDaysRange().start);
  const [appliedEndTime, setAppliedEndTime] = useState(() => getRecentThreeDaysRange().end);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const roomMatch = !appliedRoomKeyword || row.roomShortName.includes(appliedRoomKeyword) || row.dynamicRoomName.includes(appliedRoomKeyword);
      const typeMatch = !appliedDeviceType || row.deviceType === appliedDeviceType;
      const deviceMatch = !appliedDeviceName || row.resourceDeviceName.includes(appliedDeviceName) || row.resourceDeviceCode.includes(appliedDeviceName);
      const monitorMatch = !appliedMonitorObject || row.monitorObject.includes(appliedMonitorObject);
      return roomMatch && typeMatch && deviceMatch && monitorMatch;
    });
  }, [appliedDeviceName, appliedDeviceType, appliedMonitorObject, appliedRoomKeyword]);

  const handleReset = () => {
    setRoomKeyword('');
    setDeviceType('交流母线配电');
    setDeviceName('');
    setMonitorObject('');
    setAppliedRoomKeyword('');
    setAppliedDeviceType('交流母线配电');
    setAppliedDeviceName('');
    setAppliedMonitorObject('');
  };

  const handleQuery = () => {
    setAppliedRoomKeyword(roomKeyword);
    setAppliedDeviceType(deviceType);
    setAppliedDeviceName(deviceName);
    setAppliedMonitorObject(monitorObject);
  };

  const openDetail = (row: IDCPerformanceRow, mode: DetailMode) => {
    const points = getMonitorPoints(row);
    setSelectedRow(row);
    setDetailMode(mode);
    setPointSearchKeyword('');
    setRealtimeSearchKeyword('');
    if (mode === 'history') {
      const range = getRecentThreeDaysRange();
      setQueryStartTime(range.start);
      setQueryEndTime(range.end);
      setAppliedStartTime(range.start);
      setAppliedEndTime(range.end);
      setSelectedPointNames(points.map(point => point.name));
    } else {
      setSelectedPointNames([]);
    }
  };

  const handleExport = () => {
    const header = deviceExportColumns.map(col => col.label);
    const body = filteredRows.map(row =>
      deviceExportColumns
        .map(col => escapeCsvValue(row[col.key as keyof IDCPerformanceRow]))
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'IDC性能-脱敏样例.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchExport = () => {
    const header = [
      ...deviceExportColumns.map(col => col.label),
      '监控点',
      '监控点编号',
      '信号类型',
      '实测值',
      '单位',
      '请求时间',
    ];

    const body = filteredRows.flatMap(row => {
      const samples = buildRealtimeSamplesAtTime(row, getMonitorPoints(row), exportEndTime);
      return samples.map(sample =>
        [
          ...deviceExportColumns.map(col => escapeCsvValue(row[col.key as keyof IDCPerformanceRow])),
          escapeCsvValue(sample.name),
          escapeCsvValue(sample.code),
          escapeCsvValue(sample.signalType),
          escapeCsvValue(sample.value),
          escapeCsvValue(sample.unit || '-'),
          escapeCsvValue(sample.requestTime),
        ].join(',')
      );
    });

    const blob = new Blob([[header.map(escapeCsvValue).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const exportRangeLabel = `${exportStartTime.replace(/[T:]/g, '-')}_至_${exportEndTime.replace(/[T:]/g, '-')}`;
    link.download = `IDC性能-导出-${exportRangeLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleAllPoints = () => {
    if (!monitorPoints.length) return;
    const allNames = monitorPoints.map(point => point.name);
    setSelectedPointNames(current => (current.length === allNames.length ? [] : allNames));
  };

  const handleTogglePoint = (pointName: string) => {
    setSelectedPointNames(current => {
      if (current.includes(pointName)) {
        const next = current.filter(name => name !== pointName);
        return next.length > 0 ? next : current;
      }
      return [...current, pointName];
    });
  };

  const handleDetailExport = () => {
    const rowsToExport =
      detailMode === 'history'
        ? historySamples
        : filteredRealtimeSamples.map(sample => ({
            ...sample,
            groupName: sample.name,
          }));
    const header = [
      ...deviceExportColumns.map(col => col.label),
      '测点分组',
      '监控点',
      '监控点编号',
      '信号类型',
      '实测值',
      '单位',
      '请求时间',
    ];
    const body = rowsToExport.map(row =>
      [
        ...deviceExportColumns.map(col => escapeCsvValue(selectedRow?.[col.key as keyof IDCPerformanceRow])),
        escapeCsvValue('groupName' in row ? row.groupName : row.name),
        escapeCsvValue(row.name),
        escapeCsvValue(row.code),
        escapeCsvValue(row.signalType),
        escapeCsvValue(row.value),
        escapeCsvValue(row.unit || '-'),
        escapeCsvValue(row.requestTime),
      ].join(',')
    );
    const blob = new Blob([[header.map(escapeCsvValue).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IDC性能-${detailMode === 'history' ? '历史' : '实时'}-${selectedRow?.roomShortName || '导出'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderHistoryPageButtons = () => {
    const pages: Array<number | 'ellipsis'> = [];
    const maxButtons = 5;
    const start = Math.max(1, historyPage - 2);
    const end = Math.min(historyTotalPages, start + maxButtons - 1);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push('ellipsis');
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < historyTotalPages - 1) pages.push('ellipsis');
    if (end < historyTotalPages) pages.push(historyTotalPages);

    return pages;
  };

  const monitorPoints = useMemo(() => (selectedRow ? getMonitorPoints(selectedRow) : []), [selectedRow]);
  const filteredMonitorPoints = useMemo(() => {
    const keyword = pointSearchKeyword.trim();
    if (!keyword) return monitorPoints;
    return monitorPoints.filter(point => point.name.includes(keyword) || point.code.includes(keyword));
  }, [monitorPoints, pointSearchKeyword]);
  const selectedHistoryPoints = useMemo(() => {
    if (!monitorPoints.length || selectedPointNames.length === 0) return [];
    const selectedSet = new Set(selectedPointNames);
    return monitorPoints.filter(point => selectedSet.has(point.name));
  }, [monitorPoints, selectedPointNames]);
  const isAllPointsSelected = monitorPoints.length > 0 && selectedHistoryPoints.length === monitorPoints.length;
  const isSinglePointSelected = selectedHistoryPoints.length === 1;
  const selectedPoint = isSinglePointSelected ? selectedHistoryPoints[0] : null;
  const realtimeSamples = useMemo(
    () => (selectedRow ? buildRealtimeSamples(selectedRow, monitorPoints) : []),
    [monitorPoints, selectedRow]
  );
  const filteredRealtimeSamples = useMemo(() => {
    const keyword = realtimeSearchKeyword.trim();
    if (!keyword) return realtimeSamples;
    return realtimeSamples.filter(sample => sample.name.includes(keyword) || sample.code.includes(keyword));
  }, [realtimeSearchKeyword, realtimeSamples]);
  const historySamples = useMemo<HistorySample[]>(() => {
    if (!selectedRow || selectedHistoryPoints.length === 0) return [];
    const combined = selectedHistoryPoints.flatMap(point =>
      buildHistorySamples(selectedRow, point, appliedStartTime, appliedEndTime).map(sample => ({
        ...sample,
        groupName: point.name,
      }))
    );
    return combined.sort((a, b) => {
      if (a.requestTime === b.requestTime) return a.groupName.localeCompare(b.groupName);
      return a.requestTime.localeCompare(b.requestTime);
    });
  }, [appliedEndTime, appliedStartTime, selectedHistoryPoints, selectedRow]);
  const historyTotalPages = Math.max(1, Math.ceil(historySamples.length / historyPageSize));
  const historyPagedRows = useMemo(
    () => historySamples.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize),
    [historyPage, historyPageSize, historySamples]
  );
  const detailRows = detailMode === 'history' ? historyPagedRows : filteredRealtimeSamples;
  const trendOption = useMemo(
    () => ({
      grid: { top: 24, right: 18, bottom: 28, left: 44 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: selectedPoint ? buildHistorySamples(selectedRow!, selectedPoint, appliedStartTime, appliedEndTime).map(sample => sample.requestTime.slice(5, 16)) : [],
      },
      yAxis: {
        type: 'value',
        name: selectedPoint?.unit || '',
      },
      series: [
        {
          name: selectedPoint?.name ?? '监控点',
          type: 'line',
          data: selectedPoint ? buildHistorySamples(selectedRow!, selectedPoint, appliedStartTime, appliedEndTime).map(sample => sample.value) : [],
          areaStyle: {
            color: 'rgba(47,128,255,0.18)',
          },
          itemStyle: { color: '#35a3ff' },
          lineStyle: { color: '#35a3ff', width: 2 },
        },
      ],
    }),
    [appliedEndTime, appliedStartTime, selectedPoint, selectedRow]
  );

  useEffect(() => {
    setHistoryPage(1);
  }, [detailMode, selectedRow, selectedPointNames, appliedStartTime, appliedEndTime, historyPageSize, pointSearchKeyword]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#001424] text-[#d8edff]">
      <div className="flex h-9 shrink-0 items-center border-b border-[#103b70] bg-[#001424] px-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
          <span className="h-4 w-1 rounded bg-[#3ea4ff]" />
          <span>性能可视</span>
          <span className="text-[#557999]">|</span>
          <span>IDC性能</span>
        </div>
        <div className="ml-5 flex h-full items-center border-b-2 border-[#35a3ff] px-3 text-xs font-semibold text-[#46b8ff]">
          IDC性能
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <label className="flex items-center gap-3 text-xs font-semibold text-white">
            <span className="w-16 shrink-0">机房名称:</span>
            <input
              value={roomKeyword}
              onChange={event => setRoomKeyword(event.target.value)}
              placeholder="请选择机房"
              className="h-8 min-w-0 flex-1 border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none placeholder:text-[#83a8c6] focus:border-[#48b6ff]"
            />
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold text-white">
            <span className="w-16 shrink-0">设备类型:</span>
            <select
              value={deviceType}
              onChange={event => setDeviceType(event.target.value)}
              className="h-8 min-w-0 flex-1 border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none focus:border-[#48b6ff]"
            >
              <option value="">全部</option>
              <option value="交流母线配电">交流母线配电</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold text-white">
            <span className="w-16 shrink-0">设备名称:</span>
            <input
              value={deviceName}
              onChange={event => setDeviceName(event.target.value)}
              placeholder="请输入设备名称或编码"
              className="h-8 min-w-0 flex-1 border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none placeholder:text-[#83a8c6] focus:border-[#48b6ff]"
            />
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold text-white">
            <span className="w-16 shrink-0">监控对象:</span>
            <input
              value={monitorObject}
              onChange={event => setMonitorObject(event.target.value)}
              placeholder="请输入监控对象"
              className="h-8 min-w-0 flex-1 border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none placeholder:text-[#83a8c6] focus:border-[#48b6ff]"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={handleQuery}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#2f80ff] px-4 text-xs font-bold text-white shadow-[0_0_10px_rgba(47,128,255,0.25)] hover:bg-[#4191ff]"
          >
            <Search size={14} />查询
          </button>
          <button
            onClick={handleReset}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#1d5ca8] px-4 text-xs font-bold text-[#d6ebff] hover:bg-[#276bb8]"
          >
            <RotateCcw size={14} />重置
          </button>
          <button
            onClick={() => setExportDialogOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#23c47e] px-4 text-xs font-bold text-white hover:bg-[#2ed08b]"
          >
            <Download size={14} />导出
          </button>
          <button className="ml-auto inline-flex h-8 items-center gap-1 rounded bg-[#f39a0a] px-3 text-[11px] font-bold text-white hover:bg-[#ffad1f]">
            <Settings2 size={12} />列配置
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4">
        <div className="h-full overflow-auto border border-[#0d3e73] bg-[#001b31]">
          <table className="min-w-max border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#07396f] text-[#d6ecff]">
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    style={{ width: column.width, minWidth: column.width }}
                    className={`h-9 px-3 font-bold ${column.key === 'action' ? 'sticky right-0 z-30 border-l border-[#1b5c9b] bg-[#07396f] shadow-[-10px_0_14px_rgba(0,0,0,0.22)]' : ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={`${row.roomShortName}-${row.number}`}>
                  {columns.map(column => {
                    const rowBg = index % 2 === 0 ? 'bg-[#031f3a]' : 'bg-[#073468]';
                    const cellClass = `h-9 max-w-[240px] truncate border-t border-[#0a3563] px-3 font-semibold text-white ${rowBg}`;

                    if (column.key === 'action') {
                      return (
                        <td
                          key={column.key}
                          className={`sticky right-0 z-20 h-9 border-t border-l border-[#0a3563] px-3 font-semibold text-white ${rowBg} shadow-[-10px_0_14px_rgba(0,0,0,0.22)]`}
                        >
                          <span className="inline-flex min-w-[132px] items-center justify-start gap-4 whitespace-nowrap text-[#37a6ff]">
                            <button
                              onClick={() => openDetail(row, 'realtime')}
                              className="inline-flex items-center gap-1 whitespace-nowrap hover:text-white"
                            >
                              <BarChart3 size={13} />实时
                            </button>
                            <button
                              onClick={() => openDetail(row, 'history')}
                              className="inline-flex items-center gap-1 whitespace-nowrap hover:text-white"
                            >
                              <BarChart3 size={13} />历史
                            </button>
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={column.key} className={cellClass}>
                        {row[column.key]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 py-6">
          <div className="flex h-[88vh] w-[1380px] max-w-[calc(100vw-40px)] flex-col overflow-hidden border border-[#0f4c7f] bg-[#082f5f] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#0e467d] px-6">
              <div className="text-[17px] font-bold text-white">{detailMode === 'history' ? '设备测点历史数据' : '设备测点实时数据'}</div>
              <button onClick={() => setSelectedRow(null)} className="text-white hover:text-[#cde7ff]" title="关闭">
                <X size={28} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 px-4 pb-4">
                <div className="flex h-full min-h-0 flex-col overflow-hidden border border-[#0f4c7f] bg-[#061f40]">
                  <div className="flex h-14 items-center justify-between border-b border-[#0f4c7f] bg-[#082b55] px-4">
                    <div className="text-xs font-bold text-white">
                      {detailMode === 'history' ? '设备测点历史数据' : '设备测点实时数据'}
                    </div>
                    <div className="flex items-center gap-2">
                      {detailMode === 'realtime' && (
                        <label className="flex items-center">
                          <input
                            value={realtimeSearchKeyword}
                            onChange={event => setRealtimeSearchKeyword(event.target.value)}
                            placeholder="搜索监控点或编号"
                            className="h-8 w-[220px] border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none placeholder:text-[#83a8c6] focus:border-[#48b6ff]"
                          />
                        </label>
                      )}
                      <div className="rounded bg-[#0b3d70] px-2 py-1 text-[11px] text-[#9fc9ef]">
                        {detailMode === 'history'
                          ? isSinglePointSelected
                            ? `共 ${detailRows.length} 条`
                            : `共 ${detailRows.length} 条 · 多选仅列表`
                          : `共 ${filteredRealtimeSamples.length} 条${realtimeSearchKeyword.trim() ? ` / ${realtimeSamples.length} 条` : ''}`}
                      </div>
                      <button
                        type="button"
                        onClick={handleDetailExport}
                        className="inline-flex h-8 items-center gap-1 rounded bg-[#1d5ca8] px-3 text-[11px] font-bold text-[#d6ebff] hover:bg-[#276bb8]"
                      >
                        <Download size={12} />导出
                      </button>
                    </div>
                  </div>

                  {detailMode === 'realtime' ? (
                    <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
                      <table className="w-full min-w-[880px] border-collapse text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-[#07396f] text-[#d6ecff]">
                          <tr>
                            <th className="h-10 px-4 font-bold">监控点</th>
                            <th className="h-10 w-28 px-4 font-bold">监控点编号</th>
                            <th className="h-10 w-24 px-4 font-bold">信号类型</th>
                            <th className="h-10 w-24 px-4 font-bold">实测值</th>
                            <th className="h-10 w-20 px-4 font-bold">单位</th>
                            <th className="h-10 w-44 px-4 font-bold">请求时间</th>
                          </tr>
                        </thead>
                        <tbody>
                              {filteredRealtimeSamples.map((sample, index) => (
                                <tr key={`${sample.name}-${sample.requestTime}`} className={index % 2 === 0 ? 'bg-[#031f3a]' : 'bg-[#073468]'}>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.name}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.code}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.signalType}</td>
                              <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-[#7ee7ff]">{sample.value}</td>
                              <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.unit || '-'}</td>
                              <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.requestTime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1">
                      <aside className="w-72 shrink-0 border-r border-[#0f4c7f] bg-[#021729]">
                        <div className="flex h-10 items-center justify-between border-b border-[#123f68] px-3 text-xs font-bold text-[#cce8ff]">
                          <span>全部</span>
                          <span className="text-[#6fb8ee]">{monitorPoints.length}</span>
                        </div>
                        <div className="border-b border-[#123f68] px-3 py-2">
                          <input
                            value={pointSearchKeyword}
                            onChange={event => setPointSearchKeyword(event.target.value)}
                            placeholder="搜索测点或编号"
                            className="h-8 w-full border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none placeholder:text-[#83a8c6] focus:border-[#48b6ff]"
                          />
                        </div>
                        <div className="h-[calc(100%-80px)] overflow-auto">
                          <button
                            type="button"
                            onClick={handleToggleAllPoints}
                            className={`flex w-full items-center justify-between gap-2 border-b border-[#0c2f4f] px-3 py-2 text-left text-xs ${
                              isAllPointsSelected ? 'bg-[#0d477e] text-white' : 'text-[#b7d8f7] hover:bg-[#0a355f] hover:text-white'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={`h-3.5 w-3.5 rounded-[2px] border ${isAllPointsSelected ? 'border-[#7fd1ff] bg-[#2f80ff]' : 'border-[#4c7398] bg-[#082b52]'}`} />
                              <span className="min-w-0 truncate">全部</span>
                            </span>
                            <span className="shrink-0 text-[#6fb8ee]">{monitorPoints.length}</span>
                          </button>
                          {filteredMonitorPoints.map(point => {
                            const checked = selectedPointNames.includes(point.name);
                            return (
                              <button
                                type="button"
                                key={`${point.name}-${point.code}`}
                                onClick={() => handleTogglePoint(point.name)}
                                className={`flex w-full items-center justify-between gap-2 border-b border-[#0c2f4f] px-3 py-2 text-left text-xs ${
                                  checked ? 'bg-[#0d477e] text-white' : 'text-[#b7d8f7] hover:bg-[#0a355f] hover:text-white'
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className={`h-3.5 w-3.5 rounded-[2px] border ${checked ? 'border-[#7fd1ff] bg-[#2f80ff]' : 'border-[#4c7398] bg-[#082b52]'}`} />
                                  <span className="min-w-0 truncate">{point.name}</span>
                                </span>
                                <span className="shrink-0 text-[#6fb8ee]">{point.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      </aside>

                      <section className="flex min-w-0 flex-1 flex-col">
                        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#123f68] px-4 text-xs font-semibold text-white">
                          <span className="shrink-0">统计时间:</span>
                          <input
                            type="datetime-local"
                            value={queryStartTime}
                            onChange={event => setQueryStartTime(event.target.value)}
                            className="h-8 w-[240px] border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none focus:border-[#48b6ff]"
                          />
                          <span className="text-[#a8c9e7]">~</span>
                          <input
                            type="datetime-local"
                            value={queryEndTime}
                            onChange={event => setQueryEndTime(event.target.value)}
                            className="h-8 w-[240px] border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none focus:border-[#48b6ff]"
                          />
                          <button
                            onClick={() => {
                              setAppliedStartTime(queryStartTime);
                              setAppliedEndTime(queryEndTime);
                            }}
                            className="ml-10 inline-flex h-9 items-center gap-1.5 rounded bg-[#2f80ff] px-4 text-xs font-bold text-white hover:bg-[#4191ff]"
                          >
                            <Search size={14} />查询
                          </button>
                          <button
                            onClick={() => {
                              const range = getRecentThreeDaysRange();
                              setQueryStartTime(range.start);
                              setQueryEndTime(range.end);
                              setAppliedStartTime(range.start);
                              setAppliedEndTime(range.end);
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#1d5ca8] px-4 text-xs font-bold text-[#d6ebff] hover:bg-[#276bb8]"
                          >
                            <RotateCcw size={14} />重置
                          </button>
                          <span className="ml-auto rounded bg-[#0b3d70] px-3 py-1 text-[11px] text-[#9fc9ef]">
                            15min粒度 · {isSinglePointSelected ? selectedPoint?.name : `多选 ${selectedHistoryPoints.length} 个测点`}
                          </span>
                        </div>

                        {isSinglePointSelected && (
                          <div className="h-52 shrink-0 border-b border-[#0f4c7f] px-4 py-3">
                            <BaseChart option={trendOption} />
                          </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-auto">
                          <table className="w-full min-w-[880px] border-collapse text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-[#07396f] text-[#d6ecff]">
                              <tr>
                                <th className="h-10 px-4 font-bold">监控点</th>
                                <th className="h-10 w-28 px-4 font-bold">监控点编号</th>
                                <th className="h-10 w-24 px-4 font-bold">信号类型</th>
                                <th className="h-10 w-24 px-4 font-bold">实测值</th>
                                <th className="h-10 w-20 px-4 font-bold">单位</th>
                                <th className="h-10 w-44 px-4 font-bold">请求时间</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailRows.map((sample, index) => (
                                <tr key={`${sample.name}-${sample.requestTime}`} className={index % 2 === 0 ? 'bg-[#031f3a]' : 'bg-[#073468]'}>
                                  <td className="h-10 max-w-[420px] truncate border-t border-[#0a3563] px-4 font-semibold text-white">{sample.name}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.code}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.signalType}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-[#7ee7ff]">{sample.value}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.unit || '-'}</td>
                                  <td className="h-10 border-t border-[#0a3563] px-4 font-semibold text-white">{sample.requestTime}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex h-12 shrink-0 items-center gap-3 border-t border-[#0f4c7f] px-4 text-xs font-semibold text-white">
                          <span>共 {historySamples.length} 条</span>
                          <button
                            type="button"
                            onClick={() => setHistoryPage(page => Math.max(1, page - 1))}
                            disabled={historyPage === 1}
                            className="h-8 w-8 rounded bg-[#0e4f9b] text-[#cfe8ff] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ‹
                          </button>
                          {renderHistoryPageButtons().map((item, index) =>
                            item === 'ellipsis' ? (
                              <span key={`ellipsis-${index}`} className="px-1 text-[#6f9bc2]">
                                …
                              </span>
                            ) : (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setHistoryPage(item)}
                                className={`h-8 min-w-8 rounded px-2 ${
                                  historyPage === item ? 'bg-[#2c86ff] text-white' : 'bg-[#0e4f9b] text-[#cfe8ff]'
                                }`}
                              >
                                {item}
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => setHistoryPage(page => Math.min(historyTotalPages, page + 1))}
                            disabled={historyPage === historyTotalPages}
                            className="h-8 w-8 rounded bg-[#0e4f9b] text-[#cfe8ff] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ›
                          </button>
                          <select
                            value={historyPageSize}
                            onChange={event => setHistoryPageSize(Number(event.target.value))}
                            className="h-8 rounded border border-[#215e9b] bg-[#062b55] px-3 text-xs text-[#dceeff]"
                          >
                            <option value={20}>20条/页</option>
                            <option value={50}>50条/页</option>
                            <option value={100}>100条/页</option>
                          </select>
                          <span className="ml-2">前往</span>
                          <input
                            value={historyPage}
                            onChange={event => {
                              const next = Number(event.target.value);
                              if (Number.isFinite(next)) setHistoryPage(Math.min(historyTotalPages, Math.max(1, next)));
                            }}
                            className="h-8 w-12 border border-[#215e9b] bg-[#062b55] text-center text-xs text-white"
                          />
                          <span>页</span>
                          <span className="ml-auto text-[#9fc9ef]">
                            第 {historyPage} / {historyTotalPages} 页
                          </span>
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {exportDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 py-6">
          <div className="flex w-[720px] max-w-[calc(100vw-40px)] flex-col overflow-hidden border border-[#0f4c7f] bg-[#082f5f] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#0e467d] px-6">
              <div className="text-[17px] font-bold text-white">导出</div>
              <button onClick={() => setExportDialogOpen(false)} className="text-white hover:text-[#cde7ff]" title="关闭">
                <X size={28} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-6 text-xs font-semibold text-white">
              <div className="rounded border border-[#0f4c7f] bg-[#061f40] px-4 py-3 text-[#9fc9ef]">
                请选择导出时间范围。导出将按结束时间生成当前时点性能快照，文件名会带上所选区间。
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3">
                  <span className="w-16 shrink-0">开始时间:</span>
                  <input
                    type="datetime-local"
                    value={exportStartTime}
                    onChange={event => setExportStartTime(event.target.value)}
                    className="h-8 min-w-0 flex-1 border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none focus:border-[#48b6ff]"
                  />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-16 shrink-0">结束时间:</span>
                  <input
                    type="datetime-local"
                    value={exportEndTime}
                    onChange={event => setExportEndTime(event.target.value)}
                    className="h-8 min-w-0 flex-1 border border-[#1e65a8] bg-[#062b55] px-3 text-xs text-[#d9efff] outline-none focus:border-[#48b6ff]"
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setExportDialogOpen(false)}
                  className="inline-flex h-9 items-center gap-1.5 rounded bg-[#1d5ca8] px-4 text-xs font-bold text-[#d6ebff] hover:bg-[#276bb8]"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    handleBatchExport();
                    setExportDialogOpen(false);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded bg-[#23c47e] px-4 text-xs font-bold text-white hover:bg-[#2ed08b]"
                >
                  <Download size={14} />确认导出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-12 shrink-0 items-center gap-3 px-4 text-xs font-semibold text-white">
        <span>共 {filteredRows.length} 条</span>
        <button className="h-8 w-8 rounded bg-[#0e4f9b] text-[#cfe8ff]">‹</button>
        <button className="h-8 w-8 rounded bg-[#2c86ff] text-white">1</button>
        <button className="h-8 w-8 rounded bg-[#0e4f9b] text-[#cfe8ff]">›</button>
        <select className="h-8 rounded border border-[#215e9b] bg-[#062b55] px-3 text-xs text-[#dceeff]">
          <option>100条/页</option>
          <option>50条/页</option>
          <option>20条/页</option>
        </select>
        <span className="ml-2">前往</span>
        <input value="1" readOnly className="h-8 w-12 border border-[#215e9b] bg-[#062b55] text-center text-xs text-white" />
        <span>页</span>
      </div>
    </div>
  );
};
