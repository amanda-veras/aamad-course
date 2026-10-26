import type { OutputStatus, OutputType, ReviewOutput, Run, RunStatus, Ticket } from '../domain';

const API_BASE = '/api';
const HISTORY_KEY = 'support-crew-api-runs-v1';

const outputTypes: OutputType[] = [
  'classification', 'sentiment_context', 'knowledge', 'response', 'escalation',
];
const outputStatuses: OutputStatus[] = ['complete', 'limited', 'failed', 'skipped'];
const runStatuses: RunStatus[] = ['analyzing', 'ready_for_review', 'incomplete', 'failed'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`Backend response has an invalid ${field}.`);
  return value;
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`Backend response has an invalid ${field}.`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined || value === null || typeof value === 'string') return value;
  throw new Error(`Backend response has an invalid ${field}.`);
}

function optionalBoolean(value: unknown, field: string): boolean | null | undefined {
  if (value === undefined || value === null || typeof value === 'boolean') return value;
  throw new Error(`Backend response has an invalid ${field}.`);
}

function parseTicket(value: unknown): Ticket {
  if (!isRecord(value)) throw new Error('Backend response has an invalid ticket.');
  return {
    id: requiredString(value.id, 'ticket id'),
    subject: requiredString(value.subject, 'ticket subject'),
    text: requiredString(value.text, 'ticket text'),
    records: stringArray(value.records, 'ticket records'),
    gaps: stringArray(value.gaps, 'ticket gaps'),
  };
}

function parseOutput(value: unknown): ReviewOutput {
  if (!isRecord(value)) throw new Error('Backend response has an invalid output.');
  if (!outputTypes.includes(value.type as OutputType)) {
    throw new Error('Backend response has an unknown output type.');
  }
  if (!outputStatuses.includes(value.status as OutputStatus)) {
    throw new Error('Backend response has an unknown output status.');
  }
  const type = value.type as OutputType;
  if (value.output_type !== type) {
    throw new Error('Backend response output type does not match its contract.');
  }
  const evidenceRefs = stringArray(value.evidenceRefs, 'output evidence references');
  const missingFacts = stringArray(value.missingFacts, 'output missing facts');

  const output: ReviewOutput = {
    type,
    status: value.status as OutputStatus,
    detail: requiredString(value.detail, 'output detail'),
    rationale: requiredString(value.rationale, 'output rationale'),
    evidenceRefs,
    missingFacts,
    ticket_id: requiredString(value.ticket_id, 'output ticket id'),
    run_id: requiredString(value.run_id, 'output run id'),
    output_type: type,
    evidence_refs: value.evidence_refs === undefined
      ? undefined
      : stringArray(value.evidence_refs, 'output evidence references'),
    missing_facts: value.missing_facts === undefined
      ? undefined
      : stringArray(value.missing_facts, 'output missing facts'),
    conflicting_facts: value.conflicting_facts === undefined
      ? undefined
      : stringArray(value.conflicting_facts, 'output conflicting facts'),
    error: optionalString(value.error, 'output error'),
    issue_label: optionalString(value.issue_label, 'classification label'),
    priority_label: optionalString(value.priority_label, 'priority label'),
    tone: optionalString(value.tone, 'sentiment tone'),
    impact_context: optionalString(value.impact_context, 'impact context'),
    no_match: optionalBoolean(value.no_match, 'knowledge match status'),
    draft_text: optionalString(value.draft_text, 'response draft'),
    cannot_answer_reason: optionalString(value.cannot_answer_reason, 'response limitation'),
    claim_refs: value.claim_refs === undefined
      ? undefined
      : stringArray(value.claim_refs, 'response claim references'),
    human_assessment_recommended: optionalBoolean(
      value.human_assessment_recommended, 'human assessment recommendation',
    ),
    assessment_reason: optionalString(value.assessment_reason, 'human assessment reason'),
    specialist_referral_suggested: optionalBoolean(
      value.specialist_referral_suggested, 'specialist referral recommendation',
    ),
    referral_reason: optionalString(value.referral_reason, 'specialist referral reason'),
    proposed_specialist: optionalString(value.proposed_specialist, 'proposed specialist'),
  };

  if (value.matches !== undefined) {
    if (!Array.isArray(value.matches)) throw new Error('Backend response has invalid knowledge matches.');
    output.matches = value.matches.map((match) => {
      if (!isRecord(match)) throw new Error('Backend response has an invalid knowledge match.');
      return {
        source_id: requiredString(match.source_id, 'knowledge source id'),
        passage_id: requiredString(match.passage_id, 'knowledge passage id'),
        version: requiredString(match.version, 'knowledge version'),
        excerpt: requiredString(match.excerpt, 'knowledge excerpt'),
      };
    });
  }
  return output;
}

function parseRun(value: unknown): Run {
  if (!isRecord(value)) throw new Error('Backend response has an invalid run.');
  if (!runStatuses.includes(value.status as RunStatus)) {
    throw new Error('Backend response has an unknown run status.');
  }
  if (!Array.isArray(value.outputs)) throw new Error('Backend response has invalid run outputs.');

  const id = requiredString(value.id, 'run id');
  const ticket = parseTicket(value.ticket);
  const outputs = value.outputs.map(parseOutput);
  if (outputs.some((output) => output.run_id !== id || output.ticket_id !== ticket.id)) {
    throw new Error('Backend response output does not match the run ticket or id.');
  }

  return {
    id,
    ticket,
    startedAt: requiredString(value.startedAt, 'run start time'),
    status: value.status as RunStatus,
    outputs,
    failedStep: optionalString(value.failedStep, 'failed step') ?? undefined,
    error: optionalString(value.error, 'run error') ?? undefined,
    revisionParentId: optionalString(value.revisionParentId, 'revision parent id'),
    reviewerNote: optionalString(value.reviewerNote, 'reviewer note'),
  };
}

async function request(fetcher: typeof fetch, path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetcher(`${API_BASE}${path}`, init);
  const body = await response.text();
  let payload: unknown;
  try {
    payload = body ? JSON.parse(body) : undefined;
  } catch {
    throw new Error(`Backend returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    const detail = isRecord(payload) && typeof payload.detail === 'string'
      ? payload.detail
      : `${response.status} ${response.statusText}`.trim();
    throw new Error(`Backend request failed: ${detail}`);
  }
  return payload;
}

function readHistoryIds(storage: Storage): string[] {
  const stored = storage.getItem(HISTORY_KEY);
  if (stored === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    throw new Error('Saved run history is invalid JSON; clear the browser history to continue.');
  }
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) {
    throw new Error('Saved run history has an invalid format; clear the browser history to continue.');
  }
  return [...new Set(value)];
}

function saveHistoryId(storage: Storage, runId: string): void {
  const ids = readHistoryIds(storage);
  storage.setItem(HISTORY_KEY, JSON.stringify([runId, ...ids.filter((id) => id !== runId)]));
}

export function createRunService(storage: Storage, fetcher: typeof fetch = fetch) {
  return {
    async startRun(ticketId: string): Promise<Run> {
      return parseRun(await request(fetcher, `/analyze/${encodeURIComponent(ticketId)}`, {
        method: 'POST',
      }));
    },
    rememberRun(runId: string): void {
      saveHistoryId(storage, runId);
    },
    async getRunStatus(runId: string): Promise<Run> {
      return parseRun(await request(fetcher, `/reviews/${encodeURIComponent(runId)}`));
    },
    async getHistory(): Promise<Run[]> {
      const runs = await Promise.all(
        readHistoryIds(storage).map((id) =>
          request(fetcher, `/reviews/${encodeURIComponent(id)}`).then(parseRun)),
      );
      return runs.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
    },
  };
}

export const runService = {
  startRun: (ticketId: string) => createRunService(window.localStorage).startRun(ticketId),
  rememberRun: (runId: string) => createRunService(window.localStorage).rememberRun(runId),
  getRunStatus: (runId: string) => createRunService(window.localStorage).getRunStatus(runId),
  getHistory: () => createRunService(window.localStorage).getHistory(),
};
