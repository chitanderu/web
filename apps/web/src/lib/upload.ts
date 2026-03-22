import { apiClient } from './request'

export enum FileTypeEnum {
  Avatar = 'avatar',
  File = 'file',
  Icon = 'icon',
  Photo = 'photo',
}
export const uploadFileToServer = (type: FileTypeEnum, file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.proxy.objects.upload.post<{
    name: string
    url: string
  }>({
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      type,
    },
  })
}
