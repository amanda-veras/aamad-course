import { useEffect, useState, type FormEvent } from 'react';
import type { OutputType, Run, UiState } from './domain';
import { nextUiState } from './domain';
import { tickets } from './fixtures';
import { runService } from './services/runs';

const labels: Record<OutputType, string> = {
  classification: 'T1a · Classification', sentiment_context: 'T1b · Sentiment & context',
  knowledge: 'T2 · Approved knowledge (coordinator stage)',
  response: 'T3a · Response draft', escalation: 'T3b · Escalation advice',
};

function stateFor(run: Run): UiState {
  return run.status === 'analyzing' ? 'running' : run.status === 'ready_for_review' ? 'done' : 'failed';
}

export default function App() {
  const [ticketId, setTicketId] = useState(tickets[0].id);
  const [run, setRun] = useState<Run | null>(null);
  const [state, setState] = useState<UiState>('idle');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Run[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const selected = tickets.find((ticket) => ticket.id === ticketId)!;

  useEffect(() => {
    let cancelled = false;
    runService.getHistory().then((runs) => {
      if (cancelled) return;
      setHistory((previous) => {
        const byId = new Map([...runs, ...previous].map((item) => [item.id, item]));
        return [...byId.values()].sort((left, right) => right.startedAt.localeCompare(left.startedAt));
      });
      setHistoryError('');
    }).catch((cause) => {
      if (cancelled) return;
      setHistoryError(cause instanceof Error ? cause.message : 'Unable to load run history.');
    }).finally(() => {
      if (!cancelled) setHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (state !== 'running' || !run) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const updated = await runService.getRunStatus(run.id);
        if (cancelled) return;
        setRun(updated);
        setHistory((previous) => [
          updated,
          ...previous.filter((item) => item.id !== updated.id),
        ]);
        if (updated.status !== 'analyzing') setState(nextUiState('running', updated.status === 'ready_for_review' ? 'complete' : 'fail'));
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Unable to read run status.');
        setState(nextUiState('running', 'fail'));
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [state, run]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'running') return;
    setError('');
    setRun(null);
    setState(nextUiState('idle', 'start'));
    try {
      const started = await runService.startRun(ticketId);
      setRun(started);
      setHistory((previous) => [
        started,
        ...previous.filter((item) => item.id !== started.id),
      ]);
      setState(stateFor(started));
      try {
        runService.rememberRun(started.id);
        setHistoryError('');
      } catch (cause) {
        setHistoryError(cause instanceof Error ? cause.message : 'Unable to save the run history index.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start run.');
      setState(nextUiState('running', 'fail'));
    }
  }

  function selectRun(item: Run) {
    setError('');
    setTicketId(item.ticket.id);
    setRun(item);
    setState(stateFor(item));
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand"><span className="brand-mark" aria-hidden="true">✳</span><span>Support Crew <small>REVIEW CONSOLE</small></span></div>
        <nav aria-label="Page sections"><a href="#inputs">Inputs</a><a href="#run">Run</a><a href="#results">Results</a><a href="#history">History</a></nav>
      </header>
      <main>
        <div className="hero"><p className="eyebrow">SYNTHETIC DEMONSTRATION · NO LIVE DATA</p><h1>One ticket. Five outputs.<br /><em>For human review.</em></h1><p>Inspect a fictional support case, start a sample run, and review each output separately. No message is sent and no ticket is transferred.</p></div>
        <div className="layout">
          <div className="primary">
            <section id="inputs" className="panel" aria-labelledby="inputs-title">
              <div className="section-heading"><span className="number">01</span><div><p className="eyebrow">CASE FILE</p><h2 id="inputs-title">Inputs</h2></div></div>
              <form onSubmit={submit} id="ticket-form">
                <label htmlFor="ticket">Choose a synthetic ticket</label>
                <select id="ticket" value={ticketId} onChange={(event) => { setTicketId(event.target.value); setRun(null); setState('idle'); setError(''); }} disabled={state === 'running'}>
                  {tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.id} · {ticket.subject}</option>)}
                </select>
                <div className="ticket"><span className="pill">{selected.id}</span><h3>{selected.subject}</h3><p>{selected.text}</p></div>
                <h4>Provided records</h4><ul>{selected.records.map((record) => <li key={record}>{record}</li>)}</ul>
                <h4>Known gaps</h4><p className="muted">{selected.gaps.length ? selected.gaps.join(' · ') : 'None identified in this fixture.'}</p>
              </form>
            </section>
            <section id="run" className="panel" aria-labelledby="run-title">
              <div className="section-heading"><span className="number">02</span><div><p className="eyebrow">LOCAL BACKEND</p><h2 id="run-title">Run</h2></div></div>
              <p className="muted">Runs the local backend against fictional tickets and its deterministic mock. Results are validated locally; no hosted model, live data, or external service is contacted.</p>
              <div className="run-actions"><button type="submit" form="ticket-form" disabled={state === 'running'}>{state === 'running' ? 'Running sample…' : 'Start sample run'} <span aria-hidden="true">↗</span></button><span className={`status ${state}`} role="status" aria-live="polite">{state === 'idle' ? 'Idle' : state === 'running' ? 'Running' : state === 'done' ? 'Ready for review' : 'Failed'}</span></div>
              {error && <p className="error" role="alert">{error}</p>}
              {run && <p className="muted small">Run {run.id} · Started {new Date(run.startedAt).toLocaleString()} · Ticket {run.ticket.id}</p>}
            </section>
            <section id="results" className="panel" aria-labelledby="results-title">
              <div className="section-heading"><span className="number">03</span><div><p className="eyebrow">FIVE SEPARATE OUTPUTS</p><h2 id="results-title">Results</h2></div></div>
              {!run && <p className="empty">Start a sample run or select one from History to inspect its results.</p>}
              {run && state === 'running' && <p className="empty" role="status">Preparing sample outputs for {run.ticket.id}…</p>}
              {run && state === 'failed' && <p className="error" role="alert">Run incomplete. {run.failedStep ? `Failed step: ${run.failedStep}. ` : ''}{run.error ?? error} Available outputs remain below.</p>}
              {run && state === 'done' && <p className="notice">Local synthetic analysis is complete and available for human review. This console does not record reviewer decisions or execute actions.</p>}
              {run?.outputs.map((output, index) => <article className="output" key={output.type}>
                <div className="output-title"><span className="output-index">0{index + 1}</span><h3>{labels[output.type]}</h3><span className={`tag ${output.status}`}>{output.status}</span></div>
                <p className="detail">{output.detail}</p><p className="muted">{output.rationale}</p>
                {output.issue_label && <p><strong>Issue / priority:</strong> {output.issue_label} / {output.priority_label}</p>}
                {(output.tone || output.impact_context) && <p><strong>Tone / impact:</strong> {output.tone ?? 'Not available'} / {output.impact_context ?? 'Not available'}</p>}
                {output.matches?.map((match) => <p className="muted" key={`${match.source_id}/${match.passage_id}/${match.version}`}><strong>Approved passage:</strong> {match.source_id}/{match.passage_id}/{match.version} — {match.excerpt}</p>)}
                {output.draft_text && <p><strong>Draft:</strong> {output.draft_text}</p>}
                {output.cannot_answer_reason && <p><strong>Cannot answer:</strong> {output.cannot_answer_reason}</p>}
                {output.claim_refs && output.claim_refs.length > 0 && <p><strong>Claim references:</strong> {output.claim_refs.join(' · ')}</p>}
                {output.human_assessment_recommended !== undefined && <p><strong>Human assessment:</strong> {output.human_assessment_recommended ? 'Recommended' : 'Not recommended'} — {output.assessment_reason}</p>}
                {output.specialist_referral_suggested !== undefined && <p><strong>Specialist referral:</strong> {output.specialist_referral_suggested ? 'Suggested' : 'Not suggested'} — {output.referral_reason}</p>}
                {output.proposed_specialist && <p><strong>Proposed specialist:</strong> {output.proposed_specialist}</p>}
                {output.no_match && <p><strong>Knowledge search:</strong> No approved match was found.</p>}
                {output.conflicting_facts && output.conflicting_facts.length > 0 && <p><strong>Conflicting facts:</strong> {output.conflicting_facts.join(' · ')}</p>}
                {output.error && <p className="error"><strong>Stage error:</strong> {output.error}</p>}
                <div className="evidence"><strong>Validated evidence references</strong><p>{output.evidenceRefs.length ? output.evidenceRefs.join(' · ') : 'No applicable source found'}</p>{output.missingFacts.length > 0 && <p><strong>Missing:</strong> {output.missingFacts.join(' · ')}</p>}</div>
              </article>)}
            </section>
          </div>
          <aside id="history" className="panel history" aria-labelledby="history-title">
            <div className="section-heading"><span className="number">04</span><div><p className="eyebrow">THIS BROWSER ONLY</p><h2 id="history-title">History</h2></div></div>
            <p className="muted small">Run IDs are indexed in this browser; run details are retrieved from the local backend trace. No reviewer decisions are recorded here.</p>
            {historyError && <p className="error" role="alert">{historyError}</p>}
            {historyLoading && <p className="empty" role="status">Loading backend history…</p>}
            {!historyLoading && !historyError && history.length === 0 && <p className="empty">No backend runs yet.</p>}
            {history.length > 0 && <ul className="history-list">{history.map((item) => <li key={item.id}><button type="button" className="history-item" onClick={() => selectRun(item)} disabled={state === 'running'} aria-label={`View run for ${item.ticket.id} started ${new Date(item.startedAt).toLocaleString()}`}><strong>{item.ticket.id}</strong><span>{item.ticket.subject}</span><small>{new Date(item.startedAt).toLocaleString()} · {item.status === 'analyzing' ? 'Running' : item.status === 'ready_for_review' ? 'Ready for review' : 'Incomplete'}</small></button></li>)}</ul>}
          </aside>
        </div>
      </main>
      <footer>LOCAL DEMO / SYNTHETIC CASES ONLY <span>Human review required before any real-world use.</span></footer>
    </div>
  );
}
