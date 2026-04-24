import http from '@/src/lib/http'
import type { ApiEnvelope, FileUpload } from '@/src/types/domain'

const fileApiRequest = {
  upload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<ApiEnvelope<FileUpload>>('/file/media/upload', formData)
  }
}

export default fileApiRequest
