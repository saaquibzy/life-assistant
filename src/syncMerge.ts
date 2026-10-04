export type SyncRecordType = "task" | "session" | "setting" | "habit";

export type SyncRecord = {
  record_type: SyncRecordType;
  record_key: string;
  payload: unknown | null;
  updated_at: string;
};

export type SessionPayload = {
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  trimmedFrom?: string;
};

export const syncRecordId = (record: Pick<SyncRecord, "record_type" | "record_key">) =>
  `${record.record_type}:${record.record_key}`;

export function validateSyncRecords(value: unknown): value is SyncRecord[] {
  return Array.isArray(value) && value.every((record) => {
    if (!record || typeof record !== "object") return false;
    const item = record as Record<string, unknown>;
    if (!["task", "session", "setting", "habit"].includes(String(item.record_type)) || typeof item.record_key !== "string" ||
      item.payload === undefined || typeof item.updated_at !== "string" || !Number.isFinite(Date.parse(item.updated_at))) return false;
    if (item.payload === null) return true;
    if (item.record_type === "session") {
      const payload = item.payload as Record<string, unknown>;
      return Boolean(payload && typeof payload.taskId === "string" && typeof payload.startedAt === "string" &&
        (typeof payload.endedAt === "string" || payload.endedAt === null) &&
        (payload.trimmedFrom === undefined || typeof payload.trimmedFrom === "string"));
    }
    if (item.record_type === "setting") return ["strictGates", "habitsEnabled", "swipeDefaultHome", "notifyAtBudget"].includes(String(item.record_key)) && typeof item.payload === "boolean";
    if (item.record_type === "habit") return item.payload === true && /^\d{4}-\d{2}-\d{2}:.+$/.test(item.record_key);
    if (typeof item.payload !== "object") return false;
    const task = item.payload as Record<string, unknown>;
    return ["not_started", "in_progress", "done", "parked"].includes(String(task.status)) && typeof task.doneAt === "string" &&
      typeof task.notes === "string" && typeof task.proofLink === "string" && typeof task.minimumPass === "boolean" &&
      (typeof task.skippedAt === "string" || task.skippedAt === null);
  });
}

const sessionRecord = (record: SyncRecord) => record.record_type === "session" && record.payload !== null;

export function mergeSyncRecords(local: SyncRecord[], remote: SyncRecord[]): SyncRecord[] {
  const records = new Map<string, SyncRecord>();
  for (const record of [...local, ...remote]) {
    const id = syncRecordId(record);
    const current = records.get(id);
    if (!current) {
      records.set(id, record);
      continue;
    }
    if (record.record_type === "session" && current.payload !== null && record.payload !== null) {
      const a = current.payload as SessionPayload;
      const b = record.payload as SessionPayload;
      if (Boolean(a.endedAt) !== Boolean(b.endedAt)) {
        const winner = a.endedAt ? current : record;
        const newestTimestamp = Date.parse(current.updated_at) >= Date.parse(record.updated_at) ? current.updated_at : record.updated_at;
        records.set(id, winner.updated_at === newestTimestamp ? winner : { ...winner, updated_at: newestTimestamp });
        continue;
      }
    }
    // Strict comparison keeps the local version stable when timestamps tie.
    if (Date.parse(record.updated_at) > Date.parse(current.updated_at)) records.set(id, record);
  }
  return normalizeOpenSessions([...records.values()]);
}

export function normalizeOpenSessions(records: SyncRecord[]): SyncRecord[] {
  const open = records.filter((record) => sessionRecord(record) && !(record.payload as SessionPayload).endedAt);
  if (open.length <= 1) return records;
  const keeper = [...open].sort((a, b) => {
    const aStart = Date.parse((a.payload as SessionPayload).startedAt);
    const bStart = Date.parse((b.payload as SessionPayload).startedAt);
    return bStart - aStart || a.record_key.localeCompare(b.record_key);
  })[0];
  const closeAt = (keeper.payload as SessionPayload).startedAt;
  return records.map((record) => {
    if (record === keeper || !sessionRecord(record) || (record.payload as SessionPayload).endedAt) return record;
    return {
      ...record,
      payload: { ...(record.payload as SessionPayload), endedAt: closeAt },
      updated_at: closeAt,
    };
  });
}
