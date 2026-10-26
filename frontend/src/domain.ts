export type UiState = 'idle' | 'running' | 'done' | 'failed';
export type RunStatus = 'analyzing' | 'ready_for_review' | 'failed';
export type OutputStatus = 'complete' | 'limited' | 'failed' | 'skipped';
export type OutputType = 'classification' | 'knowledge' | 'sentiment_context' | 'response' | 'escalation';

export interface Ticket {
  id: string;
  subject: string;
  text: string;
  records: string[];
  gaps: string[];
}

export interface ReviewOutput {
  type: OutputType;
  status: OutputStatus;
  detail: string;
  rationale: string;
  evidenceRefs: string[];
  missingFacts: string[];
}

export interface Run {
  id: string;
  ticket: Ticket;
  startedAt: string;
  status: RunStatus;
  outputs: ReviewOutput[];
  failedStep?: string;
  error?: string;
}

export function nextUiState(current: UiState, event: 'start' | 'complete' | 'fail' | 'reset'): UiState {
  if (event === 'reset') return 'idle';
  if (current === 'idle' && event === 'start') return 'running';
  if (current === 'running' && event === 'complete') return 'done';
  if (current === 'running' && event === 'fail') return 'failed';
  return current;
}
