import { describe, expect, it } from 'vitest';
import { nextUiState } from '../domain';
import { createRunService } from './runs';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
  };
}

function apiRun(id = 'run-101', startedAt = '2026-10-26T12:00:00Z'): Record<string, unknown> {
  return {
    id,
    ticket: {
      id: 'SYN-101',
      subject: 'Order tracking question',
      text: 'Could you confirm how I can check my order status?',
      records: ['record:order-101.status = processing'],
      gaps: [],
    },
    startedAt,
    status: 'ready_for_review',
    failedStep: null,
    error: null,
    revisionParentId: null,
    reviewerNote: null,
    outputs: [
      {
        type: 'classification', output_type: 'classification', status: 'complete',
        ticket_id: 'SYN-101', run_id: id,
        detail: 'Order status question · routine', rationale: 'Ticket asks about status.',
        evidenceRefs: ['ticket:SYN-101'], evidence_refs: ['ticket:SYN-101'],
        missingFacts: [], missing_facts: [], conflicting_facts: [],
        issue_label: 'order tracking', priority_label: 'routine',
      },
      {
        type: 'sentiment_context', output_type: 'sentiment_context', status: 'complete',
        ticket_id: 'SYN-101', run_id: id,
        detail: 'Neutral tone; status inquiry', rationale: 'Assessment is independent.',
        evidenceRefs: ['ticket:SYN-101'], evidence_refs: ['ticket:SYN-101'],
        missingFacts: [], missing_facts: [], conflicting_facts: [],
        tone: 'neutral', impact_context: 'status inquiry',
      },
      {
        type: 'knowledge', output_type: 'knowledge', status: 'complete',
        ticket_id: 'SYN-101', run_id: id,
        detail: 'Approved portal guidance', rationale: 'Coordinator lookup.',
        evidenceRefs: ['knowledge:TRACK-01/passage-1/v1'],
        evidence_refs: ['knowledge:TRACK-01/passage-1/v1'],
        missingFacts: [], missing_facts: [], conflicting_facts: [], no_match: false,
        matches: [{
          source_id: 'TRACK-01', passage_id: 'passage-1', version: 'v1',
          excerpt: 'Customers can check an order in the portal.',
        }],
      },
      {
        type: 'response', output_type: 'response', status: 'complete',
        ticket_id: 'SYN-101', run_id: id,
        detail: 'Check the customer portal.', rationale: 'Supported by approved guidance.',
        evidenceRefs: ['knowledge:TRACK-01/passage-1/v1'],
        evidence_refs: ['knowledge:TRACK-01/passage-1/v1'],
        missingFacts: [], missing_facts: [], conflicting_facts: [],
        draft_text: 'Check the customer portal.',
        claim_refs: ['knowledge:TRACK-01/passage-1/v1'],
      },
      {
        type: 'escalation', output_type: 'escalation', status: 'complete',
        ticket_id: 'SYN-101', run_id: id,
        detail: 'No assessment or referral suggested.', rationale: 'No material gap.',
        evidenceRefs: ['ticket:SYN-101'], evidence_refs: ['ticket:SYN-101'],
        missingFacts: [], missing_facts: [], conflicting_facts: [],
        human_assessment_recommended: false,
        assessment_reason: 'No material discrepancy.',
        specialist_referral_suggested: false,
        referral_reason: 'No specialist-only procedure.',
      },
    ],
  };
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('backend run service', () => {
  it('moves only through valid UI transitions', () => {
    expect(nextUiState('idle', 'complete')).toBe('idle');
    expect(nextUiState('idle', 'start')).toBe('running');
    expect(nextUiState('running', 'complete')).toBe('done');
    expect(nextUiState('running', 'fail')).toBe('failed');
    expect(nextUiState('done', 'reset')).toBe('idle');
  });

  it('posts a ticket, maps the five API envelopes, and retrieves the persisted run', async () => {
    const storage = memoryStorage();
    const calls: Array<{ url: string; method: string }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      calls.push({ url, method });
      return jsonResponse(apiRun());
    };
    const service = createRunService(storage, fetcher);

    const started = await service.startRun('SYN-101');
    service.rememberRun(started.id);
    const fetched = await service.getRunStatus(started.id);

    expect(calls).toEqual([
      { url: '/api/analyze/SYN-101', method: 'POST' },
      { url: '/api/reviews/run-101', method: 'GET' },
    ]);
    expect(started.status).toBe('ready_for_review');
    expect(started.ticket.records).toEqual(['record:order-101.status = processing']);
    expect(started.outputs.map((output) => output.type)).toEqual([
      'classification', 'sentiment_context', 'knowledge', 'response', 'escalation',
    ]);
    expect(started.outputs[2].matches?.[0].excerpt).toContain('customer');
    expect(started.outputs[3].claim_refs).toEqual(['knowledge:TRACK-01/passage-1/v1']);
    expect(started.outputs[4].specialist_referral_suggested).toBe(false);
    expect(JSON.parse(storage.getItem('support-crew-api-runs-v1')!)).toEqual(['run-101']);
    expect(fetched.id).toBe(started.id);
  });

  it('loads browser history from backend traces in newest-first order', async () => {
    const storage = memoryStorage();
    storage.setItem('support-crew-api-runs-v1', JSON.stringify(['older', 'newer']));
    const fetcher: typeof fetch = async (input) => {
      const id = String(input).split('/').at(-1);
      return jsonResponse(id === 'older'
        ? apiRun('older', '2026-10-25T12:00:00Z')
        : apiRun('newer', '2026-10-26T12:00:00Z'));
    };

    const history = await createRunService(storage, fetcher).getHistory();

    expect(history.map((run) => run.id)).toEqual(['newer', 'older']);
  });

  it('surfaces backend errors and malformed response contracts', async () => {
    const storage = memoryStorage();
    const notFound: typeof fetch = async () => jsonResponse({ detail: 'Unknown synthetic ticket' }, 404);
    await expect(createRunService(storage, notFound).startRun('UNKNOWN'))
      .rejects.toThrow('Unknown synthetic ticket');

    const malformed: typeof fetch = async () => {
      const run = apiRun();
      run.status = 'mystery';
      return jsonResponse(run);
    };
    await expect(createRunService(storage, malformed).getRunStatus('run-101'))
      .rejects.toThrow('unknown run status');
  });
});
