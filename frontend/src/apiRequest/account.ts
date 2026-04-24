import http from '@/src/lib/http'
import {
    AccountResType,
    UpdateMeBodyType
} from '@/src/schemaValidations/account.schema'

const accountApiRequest = {
    me: (sessionToken: string) =>
        http.get<AccountResType>('account/me', {
            headers: {
                Authorization: `Bearer ${sessionToken}`
            }
        }),
    meClient: () => http.get<AccountResType>('account/me'),
    updateMe: (body: UpdateMeBodyType) =>
        http.put<AccountResType>('account/me', body)
}

export default accountApiRequest