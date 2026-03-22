import type { RecentlyMetadata, RecentlyTypeEnum } from '@mx-space/api-client'
import type { ReactNode } from 'react'

/**
 * 卡片数据 - 插件只提供数据，渲染统一
 */
export interface LinkCardData {
  /** CSS 类名覆盖 */
  classNames?: {
    image?: string
    cardRoot?: string
  }
  /** 高亮/主题色 (hex 格式) */
  color?: string
  /** 卡片描述 */
  desc?: ReactNode
  /** 图片 URL */
  image?: string
  /** 卡片标题 */
  title: ReactNode
}

/**
 * URL 匹配结果
 */
export interface UrlMatchResult {
  /** 完整 URL（用于链接跳转） */
  fullUrl?: string
  /** 解析后的 ID */
  id: string
  /** 额外元数据 */
  meta?: Record<string, unknown>
}

/**
 * Feature Gate 配置
 */
export interface PluginFeatureGate {
  /** Feature flag key */
  featureKey: string
  /** 是否必须启用（默认 true） */
  mustBeEnabled?: boolean
}

/** 卡片类型样式 */
export type LinkCardTypeClass =
  | 'media'
  | 'github'
  | 'academic'
  | 'wide'
  | 'full'

/**
 * 插件接口 - 每个插件自包含
 */
export interface LinkCardPlugin<TMeta = Record<string, unknown>> {
  /** 可读名称（调试/文档用） */
  readonly displayName: string

  /** Feature gate 配置 */
  readonly featureGate?: PluginFeatureGate

  /**
   * 获取卡片数据
   * @param id - 解析后的标识符
   * @param meta - URL 匹配时的元数据
   */
  fetch(id: string, meta?: TMeta): Promise<LinkCardData>

  /**
   * Fetch raw metadata for backend storage (plain objects, no JSX).
   * If implemented, the plugin can be used by the thinking page PostBox
   * to resolve URLs into typed metadata for the recently API.
   */
  fetchRawMetadata?(
    id: string,
    url: string,
    meta?: TMeta,
  ): Promise<RecentlyMetadata>

  /**
   * 验证 ID 格式（支持显式 source 用法）
   */
  isValidId(id: string): boolean

  /**
   * 匹配 URL
   * @returns 匹配结果或 null
   */
  matchUrl(url: URL): UrlMatchResult | null

  /** 唯一标识符，匹配 LinkCardSource 枚举值 */
  readonly name: string

  /** URL 匹配优先级（越高越先匹配） */
  readonly priority?: number

  /** Map to RecentlyTypeEnum for backend metadata storage */
  readonly recentlyType?: RecentlyTypeEnum

  /** 卡片样式类型 */
  readonly typeClass?: LinkCardTypeClass
}

/**
 * 插件注册表类型
 */
export type PluginRegistry = readonly LinkCardPlugin[]
