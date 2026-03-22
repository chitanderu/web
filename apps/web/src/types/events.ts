import type { NoteModel } from '@mx-space/api-client'

export const enum EventTypes {
  ACTIVITY_LEAVE_PRESENCE = 'ACTIVITY_LEAVE_PRESENCE',
  ACTIVITY_UPDATE_PRESENCE = 'ACTIVITY_UPDATE_PRESENCE',

  ARTICLE_READ_COUNT_UPDATE = 'ARTICLE_READ_COUNT_UPDATE',
  AUTH_FAILED = 'AUTH_FAILED',

  COMMENT_CREATE = 'COMMENT_CREATE',

  GATEWAY_CONNECT = 'GATEWAY_CONNECT',

  GATEWAY_DISCONNECT = 'GATEWAY_DISCONNECT',
  NOTE_CREATE = 'NOTE_CREATE',
  NOTE_DELETE = 'NOTE_DELETE',

  NOTE_UPDATE = 'NOTE_UPDATE',
  PAGE_UPDATE = 'PAGE_UPDATE',
  // NOTE 历史遗留
  PAGE_UPDATED = 'PAGE_UPDATED',

  POST_CREATE = 'POST_CREATE',
  POST_DELETE = 'POST_DELETE',

  POST_UPDATE = 'POST_UPDATE',
  RECENTLY_CREATE = 'RECENTLY_CREATE',
  RECENTLY_DELETE = 'RECENTLY_DELETE',

  SAY_CREATE = 'SAY_CREATE',
  SAY_DELETE = 'SAY_DELETE',

  SAY_UPDATE = 'SAY_UPDATE',
  // AI Translation
  TRANSLATION_CREATE = 'TRANSLATION_CREATE',

  TRANSLATION_UPDATE = 'TRANSLATION_UPDATE',
  VISITOR_OFFLINE = 'VISITOR_OFFLINE',
  VISITOR_ONLINE = 'VISITOR_ONLINE',
}

export interface VisitorEventPayload {
  count?: number
  online?: number
  online_count?: number
  onlineCount?: number
  sessionId?: string
  timestamp?: string
}

export interface EventTypesPayload {
  [EventTypes.NOTE_UPDATE]: NoteModel
  [EventTypes.VISITOR_OFFLINE]: VisitorEventPayload
  [EventTypes.VISITOR_ONLINE]: VisitorEventPayload
}

export enum SocketEmitEnum {
  Join = 'join',
  Leave = 'leave',
  UpdateLang = 'updateLang',
  UpdateSid = 'updateSid',
}
