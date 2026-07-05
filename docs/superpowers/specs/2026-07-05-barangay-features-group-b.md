# Barangay System — Group B: Document Request & Queue + Document Release Counter

## Group B: Document Request & Queue + Document Release Counter

Two features that work together as a front-counter workflow for barangay document requests.

### PocketBase Collection

#### Collection: `document_requests`
Single collection handles both queue and release tracking.

| Field | Type | Rules |
|---|---|---|
| queue_number | text | required — e.g. "001", "002" (daily sequential) |
| resident_id | relation → residents | required |
| resident_name | text | denormalized for quick display |
| document_type | select | barangay_clearance / business_permit / certificate_of_indigency / certificate_of_residency / certificate_of_good_moral / cedula / other |
| other_document_type | text | shown when document_type = "other" |
| purpose | text | required |
| status | select | pending / processing / for_release / released / cancelled |
| assigned_to | relation → users | optional — staff processing the request |
| notes | text | internal notes |
| requested_at | date | auto-set on create |
| released_at | date | set when status → released |
| received_by | text | name of person picking up the document |

**Indexes**: `queue_number`, `status`, `document_type`, `resident_id`

**Status flow**: `pending → processing → for_release → released` (or `cancelled` from any state)

---

### API Layer

#### `src/api/documents.ts`

```typescript
interface DocumentData {
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

interface ApiDocument extends RecordModel {
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

export async function getDocuments(): Promise<ApiDocument[]>
export async function getDocument(id: string): Promise<ApiDocument>
export async function createDocument(data: DocumentData): Promise<ApiDocument>
export async function updateDocument(id: string, data: Partial<DocumentData>): Promise<ApiDocument>
export async function deleteDocument(id: string): Promise<boolean>
export async function getDailyQueueNumber(): Promise<string>
  // Fetches today's requests, returns next queue number padded to 3 digits
```

**Queue number generation** (`getDailyQueueNumber`):
- Fetch today's requests via filter: `requested_at >= 'YYYY-MM-DD 00:00:00'`
- Count them, add 1, pad to 3 digits → "001", "002", etc.

---

### UI Components

#### Document Queue Page (`/documents`)

**List**: Table with columns Queue #, Resident, Document Type, Status (colored badge), Requested At, Actions (edit/delete, status change buttons, print receipt)

**Filters**: Text search (queue # or name), status filter (dropdown), document type filter (dropdown)

**Default view**: Show all requests sorted by `-requested_at`. Today's pending items should be visually prominent.

**Create flow**:
1. Click "New Request" → slide-over panel
2. Choose resident (searchable dropdown or type-ahead from residents list)
3. Select document type
4. Enter purpose
5. Queue number auto-generated
6. Status defaults to "pending"
7. Submit → shows queue number prominently

**Status management**: Inline buttons or a status dropdown in the table row to advance status:
- "Process" (pending → processing)
- "Ready" (processing → for_release)
- "Cancel" (any → cancelled)

**Form fields**: Resident (searchable select), Document Type, Other Type (if "other"), Purpose*, Notes

#### Document Release Counter Page (`/documents/release`)

**Purpose**: Quick-release interface for the front counter. Shows only requests with status `for_release`.

**List**: Table with columns Queue #, Resident, Document Type, Requested At, Actions (Release)

**Search**: Queue number or resident name search

**Release flow**:
1. Staff searches or finds the request in the "For Release" list
2. Clicks "Release" → opens a small dialog/modal (not slide-over)
3. Enters "Received by" name
4. Confirms → status → "released", `released_at` set to now
5. Brief success toast appears

**No edit or delete** on this page — it's a single-purpose counter.

---

### Routes
- `/documents` → Document Queue (admin, staff)
- `/documents/release` → Document Release Counter (admin, staff)

### Sidebar
- **Documents** group: Document Queue, Document Release (between existing Residents and Records groups)

---

### Implementation Order
1. PocketBase migration JSON
2. `src/api/documents.ts`
3. Document Queue page (`src/features/documents/DocumentsPage.tsx`)
4. Document Release Counter page (`src/features/documents/ReleasePage.tsx`)
5. Routes update
6. Sidebar update
