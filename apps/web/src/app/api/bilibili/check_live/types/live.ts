export interface BLLive {
  code: number
  data: Data
  message: string
  ttl: number
}
interface Data {
  all_special_types: any[]
  encrypted: boolean
  hidden_till: number
  is_hidden: boolean
  is_locked: boolean
  is_portrait: boolean
  live_status: number
  live_time: number
  lock_till: number
  playurl_info: Playurl_info
  pwd_verified: boolean
  room_id: number
  room_shield: number
  short_id: number
  uid: number
}
export interface Playurl_info {
  conf_json: string
  playurl: Playurl
}
interface Playurl {
  cid: number
  dolby_qn: null
  g_qn_desc: GQnDescItem[]
  p2p_data: P2p_data
  stream: StreamItem[]
}
interface GQnDescItem {
  desc: string
  hdr_desc: string
  qn: number
}
interface StreamItem {
  format: FormatItem[]
  protocol_name: string
}
interface FormatItem {
  codec: CodecItem[]
  format_name: string
}
interface CodecItem {
  accept_qn: number[]
  base_url: string
  codec_name: string
  current_qn: number
  dolby_type: number
  hdr_qn: null
  url_info: UrlInfoItem[]
}
interface UrlInfoItem {
  extra: string
  host: string
  stream_ttl: number
}
interface P2p_data {
  m_p2p: boolean
  m_servers: null
  p2p: boolean
  p2p_type: number
}
