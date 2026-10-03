export type SyncRecordType =
  | "task"
  | "review"
  | "project-link"
  | "resume-check"
  | "setting";

export type SyncRecord = {
  record_type: SyncRecordType;
  record_key: string;
  payload: unknown | null;
  updated_at: string;
};

export const syncRecordId = (record: Pick<SyncRecord, "record_type" | "record_key">) =>
  `${record.record_type}:${record.record_key}`;

export function mergeSyncRecords(
  local: SyncRecord[],
  remote: SyncRecord[],
): SyncRecord[] {
  const records = new Map<string, SyncRecord>();
  for (const record of [...local, ...remote]) {
    const id = syncRecordId(record);
    const current = records.get(id);
    if (!current || Date.parse(record.updated_at) > Date.parse(current.updated_at)) {
      records.set(id, record);
    }
  }
  return [...records.values()];
}