import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'

const COLLECTION = 'document_requests'

export interface DocumentData {
  queue_number?: string
  resident_id?: string
  resident_name?: string
  document_type: string
  other_document_type?: string
  purpose: string
  status?: string
  assigned_to?: string
  notes?: string
  released_at?: string
  received_by?: string
}

export interface ApiDocument extends RecordModel {
  queue_number: string
  resident_id: string
  resident_name: string
  document_type: string
  other_document_type: string
  purpose: string
  status: string
  assigned_to: string
  notes: string
  requested_at: string
  released_at: string
  received_by: string
  updated: string
}

export async function getDocuments(): Promise<ApiDocument[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiDocument>({ sort: '-requested_at' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getDocument(id: string): Promise<ApiDocument> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiDocument>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createDocument(data: DocumentData): Promise<ApiDocument> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiDocument>(data)
    logActivity('create', COLLECTION, result.id, `Created document: ${result.queue_number}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateDocument(id: string, data: Partial<DocumentData>): Promise<ApiDocument> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiDocument>(id, data)
    logActivity('update', COLLECTION, id, `Updated document: ${result.queue_number}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted document`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getDailyQueueNumber(): Promise<string> {
  try {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const startOfDay = `${yyyy}-${mm}-${dd} 00:00:00`
    const existing = await getClient().collection(COLLECTION).getFullList<ApiDocument>({
      filter: `requested_at >= '${startOfDay}'`,
      requestKey: 'daily-queue',
    })
    const next = existing.length + 1
    return String(next).padStart(3, '0')
  } catch {
    return '001'
  }
}
