import type { Run, RunStatus } from '../domain';
import { sampleOutputs, tickets } from '../fixtures';

const KEY = 'support-crew-demo-runs-v1';
const DEMO_DELAY_MS = 900;

type StoredRun = { id: string; ticketId: string; startedAt: string; status: RunStatus };

function read(storage: Storage): StoredRun[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is StoredRun =>
      typeof entry === 'object' && entry !== null &&
      typeof entry.id === 'string' && typeof entry.ticketId === 'string' &&
      typeof entry.startedAt === 'string' &&
      ['analyzing', 'ready_for_review', 'failed'].includes(entry.status) &&
      tickets.some((ticket) => ticket.id === entry.ticketId));
  } catch {
    return [];
  }
}

function toRun(entry: StoredRun): Run {
  const ticket = tickets.find((item) => item.id === entry.ticketId)!;
  return {
    id: entry.id, ticket, startedAt: entry.startedAt, status: entry.status,
    outputs: entry.status === 'ready_for_review' ? sampleOutputs(ticket.id) : [],
  };
}

export function createRunService(storage: Storage) {
  return {
    async startRun(ticketId: string): Promise<Run> {
      if (!tickets.some((ticket) => ticket.id === ticketId)) throw new Error('Select a valid synthetic ticket.');
      const entry: StoredRun = { id: crypto.randomUUID(), ticketId, startedAt: new Date().toISOString(), status: 'analyzing' };
      storage.setItem(KEY, JSON.stringify([entry, ...read(storage)]));
      return toRun(entry);
    },
    async getRunStatus(runId: string): Promise<Run> {
      const entries = read(storage);
      const entry = entries.find((item) => item.id === runId);
      if (!entry) throw new Error('Run not found in local demo history.');
      if (entry.status === 'analyzing' && Date.now() - Date.parse(entry.startedAt) >= DEMO_DELAY_MS) {
        entry.status = 'ready_for_review';
        storage.setItem(KEY, JSON.stringify(entries));
      }
      return toRun(entry);
    },
    getHistory(): Run[] {
      return read(storage).map(toRun);
    },
  };
}

export const runService = {
  startRun: (ticketId: string) => createRunService(window.localStorage).startRun(ticketId),
  getRunStatus: (runId: string) => createRunService(window.localStorage).getRunStatus(runId),
  getHistory: () => {
    try {
      return createRunService(window.localStorage).getHistory();
    } catch {
      return [];
    }
  },
};
