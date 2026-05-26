type AssetDef = { src: string; w: number; h: number };

export type FolderSceneId =
  | 'agvBuilding'
  | 'agvVehicle'
  | 'visualBuilding'
  | 'visualWorkshop'
  | 'rack';

type RegistryItem = {
  id: string;
  asset: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  anchorBottom: false;
  label: string;
};

type RegistryLayout = {
  sceneId: string;
  baseMap: string;
  width: number;
  height: number;
  items: RegistryItem[];
};

const scenePath = (dir: string, name: string) => `/svg/${dir}/${name}.svg`;

const asset = (dir: string, name: string, w: number, h: number): AssetDef => ({
  src: scenePath(dir, name),
  w,
  h,
});

const item = (
  sceneId: string,
  id: string,
  assetKey: string,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  canvasW = 1672,
  canvasH = 941,
): RegistryItem => ({
  id: `${sceneId}-${id}`,
  asset: assetKey,
  cx: +(((x + width / 2) / canvasW) * 100).toFixed(2),
  cy: +(((y + height / 2) / canvasH) * 100).toFixed(2),
  w: +((width / canvasW) * 100).toFixed(2),
  h: +((height / canvasH) * 100).toFixed(2),
  anchorBottom: false,
  label,
});

export const FOLDER_SCENE_ORDER: FolderSceneId[] = [
  'agvBuilding',
  'agvVehicle',
  'visualBuilding',
  'visualWorkshop',
  'rack',
];

export const FOLDER_SCENE_NAMES: Record<FolderSceneId, string> = {
  agvBuilding: 'AGV调度车间建筑',
  agvVehicle: 'AGV小车展示',
  visualBuilding: '视觉检测车间建筑',
  visualWorkshop: '视觉检测车间内部',
  rack: '机柜',
};

export const FOLDER_SCENE_DEFAULT_BG: Record<FolderSceneId, string> = {
  agvBuilding: '/svg/agv_dispatch_workshop_building/base_no_equipment.svg',
  agvVehicle: '/svg/agv_vehicle/base_no_equipment.svg',
  visualBuilding: '/svg/visual_inspection_workshop_building/base_no_equipment.svg',
  visualWorkshop: '/svg/visual_inspection_workshop_internal/base_no_equipment.svg',
  rack: '/svg/rack_internal_structure/base_no_equipment.svg',
};

export const FOLDER_SCENE_ASSETS: Record<string, AssetDef> = {
  agvBuildingAgvVehicle: asset('agv_dispatch_workshop_building', 'agv_vehicle', 405, 289),
  agvBuildingChargingStation: asset('agv_dispatch_workshop_building', 'charging_station', 293, 369),
  agvBuildingLoadingDockShelter: asset('agv_dispatch_workshop_building', 'loading_dock_shelter', 426, 395),
  agvBuildingSecurityGatehouse: asset('agv_dispatch_workshop_building', 'security_gatehouse', 417, 283),
  agvBuildingGuardBooth: asset('agv_dispatch_workshop_building', 'guard_booth', 403, 301),
  agvBuildingStatusBeaconPole: asset('agv_dispatch_workshop_building', 'status_beacon_pole', 100, 356),

  agvInternalAgvFront: asset('agv_dispatch_workshop_internal', 'agv_front', 337, 235),
  agvInternalAgvSide: asset('agv_dispatch_workshop_internal', 'agv_side', 344, 159),
  agvInternalChargerPile: asset('agv_dispatch_workshop_internal', 'charger_pile', 327, 357),
  agvInternalBatterySwapStation: asset('agv_dispatch_workshop_internal', 'battery_swap_station', 346, 313),
  agvInternalDispatchControlCabinet: asset('agv_dispatch_workshop_internal', 'dispatch_control_cabinet', 250, 366),
  agvInternalSensorPole: asset('agv_dispatch_workshop_internal', 'sensor_pole', 288, 374),
  agvInternalSafetyBarrier: asset('agv_dispatch_workshop_internal', 'safety_barrier', 333, 240),
  agvInternalWarehouseShelf: asset('agv_dispatch_workshop_internal', 'warehouse_shelf', 305, 339),

  agvVehicleAgvLarge: asset('agv_vehicle', 'agv_large', 451, 340),
  agvVehicleAgvNormal: asset('agv_vehicle', 'agv_normal', 473, 261),
  agvVehicleAgvCharging: asset('agv_vehicle', 'agv_charging', 361, 261),
  agvVehicleAgvOffline: asset('agv_vehicle', 'agv_offline', 377, 276),
  agvVehicleChargingPile: asset('agv_vehicle', 'charging_pile', 282, 352),
  agvVehicleRouteMarker: asset('agv_vehicle', 'route_marker', 231, 235),

  officeAreaWorkstationCluster: asset('office_area_internal', 'workstation_cluster', 391, 318),
  officeAreaSingleDeskChair: asset('office_area_internal', 'single_desk_chair', 443, 277),
  officeAreaConferenceTable: asset('office_area_internal', 'conference_table', 390, 290),
  officeAreaWallOperationsScreen: asset('office_area_internal', 'wall_operations_screen', 373, 281),
  officeAreaNetworkCabinet: asset('office_area_internal', 'network_cabinet', 211, 321),
  officeAreaPrinterCopier: asset('office_area_internal', 'printer_copier', 246, 304),
  officeAreaAccessControlTerminal: asset('office_area_internal', 'access_control_terminal', 133, 309),
  officeAreaPottedPlant: asset('office_area_internal', 'potted_plant', 214, 283),

  prodConveyorModule: asset('production_workshop_internal', 'conveyor_module', 373, 270),
  prodRobotArmWorkstation: asset('production_workshop_internal', 'robot_arm_workstation', 257, 292),
  prodCncMachine: asset('production_workshop_internal', 'cnc_machine', 320, 269),
  prodPlcControlCabinet: asset('production_workshop_internal', 'plc_control_cabinet', 237, 317),
  prodAssemblyStation: asset('production_workshop_internal', 'assembly_station', 288, 310),
  prodSafetyFenceSegment: asset('production_workshop_internal', 'safety_fence_segment', 316, 275),
  prodIndustrialCameraSensor: asset('production_workshop_internal', 'industrial_camera_sensor', 254, 230),
  prodAgvVehicle: asset('production_workshop_internal', 'agv_vehicle', 315, 216),

  rackInternalPatchPanel1u: asset('rack_internal_structure', 'patch_panel_1u', 393, 81),
  rackInternalAccessSwitchNormal: asset('rack_internal_structure', 'access_switch_normal', 443, 87),
  rackInternalAccessSwitchAlarm: asset('rack_internal_structure', 'access_switch_alarm', 443, 87),
  rackInternalApplicationServer2u: asset('rack_internal_structure', 'application_server_2u', 389, 87),
  rackInternalStorageServer2u: asset('rack_internal_structure', 'storage_server_2u', 394, 143),
  rackInternalUpsModule: asset('rack_internal_structure', 'ups_module', 431, 142),
  rackInternalBlankFillerPanel: asset('rack_internal_structure', 'blank_filler_panel', 443, 118),
  rackInternalAlarmIcon: asset('rack_internal_structure', 'alarm_icon', 404, 130),

  visionAreaVisionWorkstation: asset('visual_inspection_area_internal', 'vision_workstation', 304, 383),
  visionAreaIndustrialCameraStand: asset('visual_inspection_area_internal', 'industrial_camera_stand', 157, 357),
  visionAreaRingLightModule: asset('visual_inspection_area_internal', 'ring_light_module', 234, 296),
  visionAreaInspectionTable: asset('visual_inspection_area_internal', 'inspection_table', 289, 332),
  visionAreaPlcControlCabinet: asset('visual_inspection_area_internal', 'plc_control_cabinet', 204, 377),
  visionAreaEdgeAiServerCabinet: asset('visual_inspection_area_internal', 'edge_ai_server_cabinet', 212, 351),
  visionAreaWarningBeacon: asset('visual_inspection_area_internal', 'warning_beacon', 298, 305),
  visionAreaSampleProductTray: asset('visual_inspection_area_internal', 'sample_product_tray', 330, 266),

  visionBuildingBoxTruck: asset('visual_inspection_workshop_building', 'box_truck', 367, 312),
  visionBuildingLoadingDockCanopy: asset('visual_inspection_workshop_building', 'loading_dock_canopy', 495, 362),
  visionBuildingOutdoorHvacChiller: asset('visual_inspection_workshop_building', 'outdoor_hvac_chiller', 395, 298),
  visionBuildingTransformerCabinet: asset('visual_inspection_workshop_building', 'transformer_cabinet', 285, 321),
  visionBuildingSecurityGatehouse: asset('visual_inspection_workshop_building', 'security_gatehouse', 398, 302),
  visionBuildingRoadsideBeacon: asset('visual_inspection_workshop_building', 'roadside_beacon', 136, 351),

  visionWorkshopInspectionConveyor: asset('visual_inspection_workshop_internal', 'inspection_conveyor', 372, 292),
  visionWorkshopVisionInspectionBooth: asset('visual_inspection_workshop_internal', 'vision_inspection_booth', 393, 348),
  visionWorkshopCameraGantry: asset('visual_inspection_workshop_internal', 'camera_gantry', 323, 327),
  visionWorkshopRobotPickStation: asset('visual_inspection_workshop_internal', 'robot_pick_station', 296, 326),
  visionWorkshopEdgeServerRack: asset('visual_inspection_workshop_internal', 'edge_server_rack', 231, 369),
  visionWorkshopPlcCabinet: asset('visual_inspection_workshop_internal', 'plc_cabinet', 255, 368),
  visionWorkshopAgvVehicle: asset('visual_inspection_workshop_internal', 'agv_vehicle', 340, 238),
  visionWorkshopSafetyFenceSegment: asset('visual_inspection_workshop_internal', 'safety_fence_segment', 366, 336),
};

export const FOLDER_PALETTE_GROUPS = [
  {
    title: '生产车间内部',
    items: [
      { key: 'prodConveyorModule', name: '传送带模块' },
      { key: 'prodRobotArmWorkstation', name: '机械臂工位' },
      { key: 'prodCncMachine', name: 'CNC 机床' },
      { key: 'prodPlcControlCabinet', name: 'PLC 控制柜' },
      { key: 'prodAssemblyStation', name: '装配工位' },
      { key: 'prodSafetyFenceSegment', name: '安全围栏' },
      { key: 'prodIndustrialCameraSensor', name: '工业相机' },
      { key: 'prodAgvVehicle', name: 'AGV 小车' },
    ],
  },
  {
    title: 'AGV调度车间内部',
    items: [
      { key: 'agvInternalAgvFront', name: 'AGV 正面' },
      { key: 'agvInternalAgvSide', name: 'AGV 侧面' },
      { key: 'agvInternalChargerPile', name: '充电桩' },
      { key: 'agvInternalBatterySwapStation', name: '换电站' },
      { key: 'agvInternalDispatchControlCabinet', name: '调度控制柜' },
      { key: 'agvInternalSensorPole', name: '传感器立杆' },
      { key: 'agvInternalSafetyBarrier', name: '安全护栏' },
      { key: 'agvInternalWarehouseShelf', name: '仓储货架' },
    ],
  },
  {
    title: '视觉检测区内部',
    items: [
      { key: 'visionAreaVisionWorkstation', name: '视觉工位' },
      { key: 'visionAreaIndustrialCameraStand', name: '工业相机支架' },
      { key: 'visionAreaRingLightModule', name: '环形光源' },
      { key: 'visionAreaInspectionTable', name: '检测台' },
      { key: 'visionAreaPlcControlCabinet', name: 'PLC 控制柜' },
      { key: 'visionAreaEdgeAiServerCabinet', name: '边缘 AI 柜' },
      { key: 'visionAreaWarningBeacon', name: '告警灯' },
      { key: 'visionAreaSampleProductTray', name: '样品托盘' },
    ],
  },
  {
    title: '办公区内部',
    items: [
      { key: 'officeAreaWorkstationCluster', name: '办公工位组' },
      { key: 'officeAreaSingleDeskChair', name: '单人桌椅' },
      { key: 'officeAreaConferenceTable', name: '会议桌' },
      { key: 'officeAreaWallOperationsScreen', name: '运维大屏' },
      { key: 'officeAreaNetworkCabinet', name: '网络机柜' },
      { key: 'officeAreaPrinterCopier', name: '打印复印机' },
      { key: 'officeAreaAccessControlTerminal', name: '门禁终端' },
      { key: 'officeAreaPottedPlant', name: '绿植' },
    ],
  },
  {
    title: '机柜内部结构',
    items: [
      { key: 'rackInternalPatchPanel1u', name: '1U 配线架' },
      { key: 'rackInternalAccessSwitchNormal', name: '正常接入交换机' },
      { key: 'rackInternalAccessSwitchAlarm', name: '告警接入交换机' },
      { key: 'rackInternalApplicationServer2u', name: '2U 应用服务器' },
      { key: 'rackInternalStorageServer2u', name: '2U 存储服务器' },
      { key: 'rackInternalUpsModule', name: 'UPS 模块' },
      { key: 'rackInternalBlankFillerPanel', name: '盲板' },
      { key: 'rackInternalAlarmIcon', name: '告警标识' },
    ],
  },
  {
    title: '新增场景素材',
    items: [
      { key: 'agvBuildingLoadingDockShelter', name: 'AGV装卸雨棚' },
      { key: 'agvVehicleAgvLarge', name: 'AGV 大图' },
      { key: 'visionBuildingLoadingDockCanopy', name: '视觉车间装卸棚' },
      { key: 'visionWorkshopInspectionConveyor', name: '视觉检测线' },
    ],
  },
];

export const FOLDER_SCENE_LAYOUTS: Record<string, RegistryLayout> = {
  line1: {
    sceneId: 'line1',
    baseMap: '/svg/production_workshop_internal/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('line1', 'conveyor_module', 'prodConveyorModule', 520, 380, 530, 130, '主传送带'),
      item('line1', 'robot_arm_workstation', 'prodRobotArmWorkstation', 490, 230, 170, 190, '机械臂工位'),
      item('line1', 'cnc_machine', 'prodCncMachine', 1110, 240, 210, 220, 'CNC 机床'),
      item('line1', 'plc_control_cabinet', 'prodPlcControlCabinet', 170, 430, 180, 220, 'PLC 控制柜'),
      item('line1', 'assembly_station', 'prodAssemblyStation', 760, 540, 250, 130, '装配工位'),
      item('line1', 'safety_fence_segment', 'prodSafetyFenceSegment', 180, 650, 980, 90, '安全围栏'),
      item('line1', 'industrial_camera_sensor', 'prodIndustrialCameraSensor', 1260, 320, 100, 110, '工业相机'),
      item('line1', 'agv_vehicle', 'prodAgvVehicle', 840, 675, 110, 80, 'AGV 小车'),
    ],
  },
  idc3: {
    sceneId: 'idc3',
    baseMap: '/svg/idc/layer_base_empty_room.svg',
    width: 1672,
    height: 941,
    items: [
      item('idc3', 'rack_row_1', 'idcRackRow', 505, 240, 220, 520, '机柜排 1'),
      item('idc3', 'rack_row_2', 'idcRackRow', 735, 240, 220, 520, '机柜排 2'),
      item('idc3', 'rack_row_3', 'idcRackRow', 980, 242, 220, 515, '机柜排 3'),
      item('idc3', 'rack_row_4', 'idcRackRow', 1205, 242, 220, 515, '机柜排 4'),
      item('idc3', 'ups_main', 'idcUpsMain', 70, 495, 210, 270, 'UPS 主机'),
      item('idc3', 'battery_cabinet', 'idcBatteryCab', 245, 535, 210, 230, '电池柜'),
      item('idc3', 'power_distribution', 'idcPowerCab', 350, 135, 215, 235, '配电柜'),
      item('idc3', 'ats_cabinet', 'idcAtsCab', 240, 250, 175, 230, 'ATS 柜'),
      item('idc3', 'precision_ac', 'idcPrecisionAc', 1285, 155, 210, 245, '精密空调'),
      item('idc3', 'inrow_ac_cold', 'idcInrowAc', 650, 360, 105, 230, '冷通道列间空调'),
      item('idc3', 'inrow_ac_hot', 'idcInrowAc', 1095, 360, 105, 230, '热通道列间空调'),
      item('idc3', 'fire_cylinders', 'idcFireCyl', 1450, 560, 145, 215, '气体灭火钢瓶'),
      item('idc3', 'smoke_detector_1', 'idcSmokeSensor', 760, 145, 45, 45, '烟感 1'),
      item('idc3', 'smoke_detector_2', 'idcSmokeSensor', 1065, 145, 45, 45, '烟感 2'),
      item('idc3', 'temp_humidity_sensor', 'idcTempHumSensor', 1495, 380, 50, 70, '温湿度传感器'),
      item('idc3', 'water_leak_sensor', 'idcWaterLeakSensor', 515, 810, 70, 50, '水浸传感器'),
    ],
  },
  cmpA: {
    sceneId: 'cmpA',
    baseMap: '/svg/idc/layer_base_empty_room.svg',
    width: 1672,
    height: 941,
    items: [
      item('cmpA', 'rack_row_1', 'idcRackRow', 505, 240, 220, 520, '机柜排 1'),
      item('cmpA', 'rack_row_2', 'idcRackRow', 735, 240, 220, 520, '机柜排 2'),
      item('cmpA', 'rack_row_3', 'idcRackRow', 980, 242, 220, 515, '机柜排 3'),
      item('cmpA', 'rack_row_4', 'idcRackRow', 1205, 242, 220, 515, '机柜排 4'),
      item('cmpA', 'power_distribution', 'idcPowerCab', 350, 135, 215, 235, '能源配电柜'),
      item('cmpA', 'ats_cabinet', 'idcAtsCab', 240, 250, 175, 230, 'ATS 柜'),
      item('cmpA', 'ups_main', 'idcUpsMain', 70, 495, 210, 270, 'UPS 主机'),
      item('cmpA', 'battery_cabinet', 'idcBatteryCab', 245, 535, 210, 230, '电池柜'),
      item('cmpA', 'precision_ac', 'idcPrecisionAc', 1285, 155, 210, 245, '精密空调'),
      item('cmpA', 'fire_cylinders', 'idcFireCyl', 1450, 560, 145, 215, '气体灭火钢瓶'),
    ],
  },
  agv: {
    sceneId: 'agv',
    baseMap: '/svg/agv_dispatch_workshop_internal/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('agv', 'agv_front', 'agvInternalAgvFront', 410, 350, 120, 90, 'AGV 正面'),
      item('agv', 'agv_side', 'agvInternalAgvSide', 690, 520, 120, 90, 'AGV 侧面'),
      item('agv', 'charger_pile', 'agvInternalChargerPile', 1160, 330, 120, 160, '充电桩'),
      item('agv', 'battery_swap_station', 'agvInternalBatterySwapStation', 1340, 330, 170, 140, '换电站'),
      item('agv', 'dispatch_control_cabinet', 'agvInternalDispatchControlCabinet', 240, 190, 170, 210, '调度控制柜'),
      item('agv', 'sensor_pole', 'agvInternalSensorPole', 1020, 230, 55, 130, '传感器立杆'),
      item('agv', 'safety_barrier', 'agvInternalSafetyBarrier', 920, 640, 90, 80, '安全护栏'),
      item('agv', 'warehouse_shelf', 'agvInternalWarehouseShelf', 1300, 560, 170, 130, '仓储货架'),
    ],
  },
  vision: {
    sceneId: 'vision',
    baseMap: '/svg/visual_inspection_area_internal/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('vision', 'vision_workstation', 'visionAreaVisionWorkstation', 310, 300, 180, 170, '视觉工位'),
      item('vision', 'industrial_camera_stand', 'visionAreaIndustrialCameraStand', 560, 250, 120, 140, '工业相机支架'),
      item('vision', 'ring_light_module', 'visionAreaRingLightModule', 725, 280, 160, 140, '环形光源'),
      item('vision', 'inspection_table', 'visionAreaInspectionTable', 880, 340, 220, 140, '检测台'),
      item('vision', 'plc_control_cabinet', 'visionAreaPlcControlCabinet', 1240, 400, 160, 210, 'PLC 控制柜'),
      item('vision', 'edge_ai_server_cabinet', 'visionAreaEdgeAiServerCabinet', 1330, 210, 150, 210, '边缘 AI 柜'),
      item('vision', 'warning_beacon', 'visionAreaWarningBeacon', 780, 260, 55, 110, '告警灯'),
      item('vision', 'sample_product_tray', 'visionAreaSampleProductTray', 1030, 560, 160, 100, '样品托盘'),
    ],
  },
  office: {
    sceneId: 'office',
    baseMap: '/svg/office_area_internal/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('office', 'workstation_cluster', 'officeAreaWorkstationCluster', 260, 340, 300, 180, '办公工位组'),
      item('office', 'single_desk_chair', 'officeAreaSingleDeskChair', 610, 340, 190, 150, '单人桌椅'),
      item('office', 'conference_table', 'officeAreaConferenceTable', 1100, 500, 310, 170, '会议桌'),
      item('office', 'wall_operations_screen', 'officeAreaWallOperationsScreen', 1190, 225, 230, 100, '运维大屏'),
      item('office', 'network_cabinet', 'officeAreaNetworkCabinet', 1260, 420, 130, 190, '网络机柜'),
      item('office', 'printer_copier', 'officeAreaPrinterCopier', 980, 610, 120, 120, '打印复印机'),
      item('office', 'access_control_terminal', 'officeAreaAccessControlTerminal', 180, 675, 70, 120, '门禁终端'),
      item('office', 'potted_plant', 'officeAreaPottedPlant', 860, 570, 90, 110, '绿植'),
    ],
  },
  agvBuilding: {
    sceneId: 'agvBuilding',
    baseMap: '/svg/agv_dispatch_workshop_building/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('agvBuilding', 'agv_vehicle', 'agvBuildingAgvVehicle', 850, 620, 120, 90, 'AGV 小车'),
      item('agvBuilding', 'charging_station', 'agvBuildingChargingStation', 1110, 555, 130, 120, '充电站'),
      item('agvBuilding', 'loading_dock_shelter', 'agvBuildingLoadingDockShelter', 980, 375, 250, 140, '装卸雨棚'),
      item('agvBuilding', 'security_gatehouse', 'agvBuildingSecurityGatehouse', 120, 660, 180, 150, '安保门岗'),
      item('agvBuilding', 'guard_booth', 'agvBuildingGuardBooth', 330, 635, 140, 110, '值守岗亭'),
      item('agvBuilding', 'status_beacon_pole', 'agvBuildingStatusBeaconPole', 1260, 500, 70, 120, '状态灯杆'),
    ],
  },
  agvVehicle: {
    sceneId: 'agvVehicle',
    baseMap: '/svg/agv_vehicle/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('agvVehicle', 'agv_large', 'agvVehicleAgvLarge', 390, 260, 560, 340, 'AGV 主视图'),
      item('agvVehicle', 'agv_normal', 'agvVehicleAgvNormal', 1050, 660, 150, 100, '正常 AGV'),
      item('agvVehicle', 'agv_charging', 'agvVehicleAgvCharging', 1240, 660, 150, 100, '充电 AGV'),
      item('agvVehicle', 'agv_offline', 'agvVehicleAgvOffline', 1430, 660, 150, 100, '离线 AGV'),
      item('agvVehicle', 'charging_pile', 'agvVehicleChargingPile', 1130, 260, 180, 220, '充电桩'),
      item('agvVehicle', 'route_marker', 'agvVehicleRouteMarker', 900, 690, 80, 80, '路径标记'),
    ],
  },
  visualBuilding: {
    sceneId: 'visualBuilding',
    baseMap: '/svg/visual_inspection_workshop_building/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('visualBuilding', 'box_truck', 'visionBuildingBoxTruck', 230, 660, 160, 100, '厢式货车'),
      item('visualBuilding', 'loading_dock_canopy', 'visionBuildingLoadingDockCanopy', 980, 430, 250, 130, '装卸棚'),
      item('visualBuilding', 'outdoor_hvac_chiller', 'visionBuildingOutdoorHvacChiller', 1220, 260, 230, 140, '室外冷机'),
      item('visualBuilding', 'transformer_cabinet', 'visionBuildingTransformerCabinet', 1320, 520, 160, 130, '变压器柜'),
      item('visualBuilding', 'security_gatehouse', 'visionBuildingSecurityGatehouse', 155, 560, 160, 130, '安保门岗'),
      item('visualBuilding', 'roadside_beacon', 'visionBuildingRoadsideBeacon', 1160, 610, 60, 120, '路侧灯杆'),
    ],
  },
  visualWorkshop: {
    sceneId: 'visualWorkshop',
    baseMap: '/svg/visual_inspection_workshop_internal/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('visualWorkshop', 'inspection_conveyor', 'visionWorkshopInspectionConveyor', 400, 390, 620, 120, '检测传送线'),
      item('visualWorkshop', 'vision_inspection_booth', 'visionWorkshopVisionInspectionBooth', 470, 260, 180, 170, '视觉检测舱'),
      item('visualWorkshop', 'camera_gantry', 'visionWorkshopCameraGantry', 730, 245, 220, 160, '相机龙门架'),
      item('visualWorkshop', 'robot_pick_station', 'visionWorkshopRobotPickStation', 980, 270, 180, 180, '机器人分拣工位'),
      item('visualWorkshop', 'edge_server_rack', 'visionWorkshopEdgeServerRack', 1250, 320, 140, 240, '边缘服务器机柜'),
      item('visualWorkshop', 'plc_cabinet', 'visionWorkshopPlcCabinet', 135, 420, 160, 210, 'PLC 柜'),
      item('visualWorkshop', 'agv_vehicle', 'visionWorkshopAgvVehicle', 420, 660, 110, 80, 'AGV 小车'),
      item('visualWorkshop', 'safety_fence_segment', 'visionWorkshopSafetyFenceSegment', 1120, 620, 260, 90, '安全围栏'),
    ],
  },
  rack: {
    sceneId: 'rack',
    baseMap: '/svg/rack_internal_structure/base_no_equipment.svg',
    width: 1672,
    height: 941,
    items: [
      item('rack', 'patch_panel_1u', 'rackInternalPatchPanel1u', 210, 160, 300, 42, '1U 配线架'),
      item('rack', 'access_switch_normal', 'rackInternalAccessSwitchNormal', 210, 240, 300, 42, '正常接入交换机'),
      item('rack', 'access_switch_alarm', 'rackInternalAccessSwitchAlarm', 210, 320, 300, 42, '告警接入交换机'),
      item('rack', 'application_server_2u', 'rackInternalApplicationServer2u', 210, 430, 300, 62, '2U 应用服务器'),
      item('rack', 'storage_server_2u', 'rackInternalStorageServer2u', 210, 520, 300, 62, '2U 存储服务器'),
      item('rack', 'ups_module', 'rackInternalUpsModule', 210, 630, 300, 70, 'UPS 模块'),
      item('rack', 'blank_filler_panel', 'rackInternalBlankFillerPanel', 210, 730, 300, 42, '盲板'),
      item('rack', 'alarm_icon', 'rackInternalAlarmIcon', 980, 210, 120, 120, '告警标识'),
    ],
  },
};
