export interface BLRoom {
  code: number
  data: Data
  message: string
  ttl: number
}
interface Data {
  by_room_ids: By_room_ids
  by_uids: {}
}

type By_room_ids = Record<number, RoomInfo>
export interface RoomInfo {
  area_id: number
  area_name: string
  attention: number
  background: string
  cover: string
  description: string
  join_slide: number
  live_id: number
  live_status: number
  live_time: string
  live_url: string
  online: number
  parent_area_id: number
  parent_area_name: string
  room_id: number
  short_id: number
  tags: string
  title: string
  uid: number
  uname: string
}
