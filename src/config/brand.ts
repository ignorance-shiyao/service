export const BRAND_PROFILES = {
  personal: {
    systemName: '曜枢智能服务平台',
    systemShortName: '曜枢平台',
    assistantName: '曜枢智能体',
    assistantMessageName: '曜枢助手',
    serviceEndpointName: '曜枢服务端',
    reportSignature: '由曜枢智能体生成，建议提交前结合现场反馈进行人工确认。',
    storageNamespace: 'yaoshu',
  },
  work: {
    systemName: '政企业务智慧运维管家',
    systemShortName: '运维管家',
    assistantName: '运维管家智能体',
    assistantMessageName: '智慧运维管家',
    serviceEndpointName: '智慧运维管家服务端',
    reportSignature: '由运维管家智能体生成，建议提交前结合客户现场反馈进行人工确认。',
    storageNamespace: 'ops-manager',
  },
} as const;

export type BrandProfileKey = keyof typeof BRAND_PROFILES;

// Change this value to switch all runtime branding between personal and work.
export const ACTIVE_BRAND_PROFILE: BrandProfileKey = 'personal';

export const appBrand = BRAND_PROFILES[ACTIVE_BRAND_PROFILE];
