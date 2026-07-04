import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

export interface RecordData {
  title: string
  status: 'pending' | 'approved' | 'rejected'
  created_by?: string
}

export interface ApiRecord extends RecordModel {
  title: string
  status: 'pending' | 'approved' | 'rejected'
  created_by: string
  updated: string
}

const COLLECTION = 'blotter_records'

export async function getRecords(): Promise<ApiRecord[]> {
  try {
    const result = await getClient().collection(COLLECTION).getFullList<ApiRecord>({
      sort: '-updated',
    })
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getRecord(id: string): Promise<ApiRecord> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiRecord>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createRecord(data: RecordData): Promise<ApiRecord> {
  try {
    return await getClient().collection(COLLECTION).create<ApiRecord>(data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateRecord(id: string, data: Partial<RecordData>): Promise<ApiRecord> {
  try {
    return await getClient().collection(COLLECTION).update<ApiRecord>(id, data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteRecord(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}
