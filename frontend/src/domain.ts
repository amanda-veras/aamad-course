export type UiState = 'idle' | 'running' | 'done' | 'failed';
export type RunStatus = 'analyzing' | 'ready_for_review' | 'incomplete' | 'failed';
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
  ticket_id?: string;
  run_id?: string;
  output_type?: OutputType;
  evidence_refs?: string[];
  missing_facts?: string[];
  conflicting_facts?: string[];
  error?: string | null;
  issue_label?: string | null;
  priority_label?: string | null;
  tone?: string | null;
  impact_context?: string | null;
  matches?: Array<{ source_id: string; passage_id: string; version: string; excerpt: string }>;
  no_match?: boolean;
  draft_text?: string | null;
  cannot_answer_reason?: string | null;
  claim_refs?: string[];
  human_assessment_recommended?: boolean | null;
  assessment_reason?: string | null;
  specialist_referral_suggested?: boolean | null;
  referral_reason?: string | null;
  proposed_specialist?: string | null;
}

export interface Run {
  id: string;
  ticket: Ticket;
  startedAt: string;
  status: RunStatus;
  outputs: ReviewOutput[];
  failedStep?: string;
  error?: string;
  revisionParentId?: string | null;
  reviewerNote?: string | null;
}

export function nextUiState(current: UiState, event: 'start' | 'complete' | 'fail' | 'reset'): UiState {
  if (event === 'reset') return 'idle';
  if (current === 'idle' && event === 'start') return 'running';
  if (current === 'running' && event === 'complete') return 'done';
  if (current === 'running' && event === 'fail') return 'failed';
  return current;
}
