import http from '@/src/lib/http'
import type { ApiEnvelope, EmailReceipt } from '@/src/types/domain'

const notificationApiRequest = {
  sendStudyRecap: (body: {
    to: { name: string; email: string }
    subject: string
    htmlContent: string
  }) => http.post<ApiEnvelope<EmailReceipt>>('/notification/email/send', body)
}

export default notificationApiRequest
