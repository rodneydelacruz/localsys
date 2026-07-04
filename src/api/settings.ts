import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

export interface ApiSetting extends RecordModel {
  key: string
  value: any
}

const COLLECTION = 'system_settings'

export async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const records = await getClient().collection(COLLECTION).getFullList<ApiSetting>()
    const settings: Record<string, any> = {}
    for (const record of records) {
      settings[record.key] = record.value
    }
    return settings
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getSetting(key: string): Promise<any | null> {
  try {
    const record = await getClient().collection(COLLECTION).getFirstListItem<ApiSetting>(`key = "${key}"`, {
      $autoCancel: false,
    })
    return record.value
  } catch {
    return null
  }
}

export async function updateSetting(id: string, _key: string, value: any): Promise<void> {
  try {
    await getClient().collection(COLLECTION).update(id, { value })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function upsertSetting(key: string, value: any): Promise<ApiSetting> {
  try {
    const existing = await getClient().collection(COLLECTION).getFirstListItem<ApiSetting>(`key = "${key}"`, {
      $autoCancel: false,
    }).catch(() => null)

    if (existing) {
      return await getClient().collection(COLLECTION).update(existing.id, { value })
    }

    return await getClient().collection(COLLECTION).create({ key, value })
  } catch (err) {
    throw handleApiError(err)
  }
}
