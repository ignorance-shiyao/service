
export type KBBusinessType = 'LINE' | '5G' | 'IDC' | 'SDWAN' | 'AIC';
export type KBContentType = 'FAQ' | 'VIDEO' | 'GUIDE' | 'POLICY';

export interface KnowledgeVersion {
  versionId: string;
  versionNum: string;
  updateTime: string;
  updater: string;
  changeLog: string;
  content: string;
  steps?: string[];
}

export interface KnowledgeItem {
  id: string;
  title: string;
  businessType: KBBusinessType;
  contentType: KBContentType;
  content: string;
  tags: string[];
  views: number;
  likes: number;
  updateTime: string;
  steps?: string[];
  versions?: KnowledgeVersion[]; // 新增版本记录
}

export interface KBSearchResult {
  aiAnswer: string;
  matchedItems: KnowledgeItem[];
}
