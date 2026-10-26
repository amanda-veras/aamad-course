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
  return run.status === 'analyzing' ? 'running' : run.status === 'failed' ? 'failed' : 'done';
}

export default function App() {
  const [ticketId, setTicketId] = useState(tickets[0].id);
  const [run, setRun] = useState<Run | null>(null);
  const [state, setState] = useState<UiState>('idle');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Run[]>(() => runService.getHistory());
  const selected = tickets.find((ticket) => ticket.id === ticketId)!;

  useEffect(() => {
    if (state !== 'running' || !run) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const updated = await runService.getRunStatus(run.id);
        if (cancelled) return;
        setRun(updated);
        setHistory(runService.getHistory());
        if (updated.status !== 'analyzing') setState(nextUiState('running', updated.status === 'failed' ? 'fail' : 'complete'));
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
      setHistory(runService.getHistory());
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
              <div className="section-heading"><span className="number">02</span><div><p className="eyebrow">LOCAL PREVIEW</p><h2 id="run-title">Run</h2></div></div>
              <p className="muted">This stub displays fixture outputs in the five-stage SAD order. It does not run the four CrewAI tasks, the coordinator lookup, a model, a backend, or an external service.</p>
              <div className="run-actions"><button type="submit" form="ticket-form" disabled={state === 'running'}>{state === 'running' ? 'Running sample…' : 'Start sample run'} <span aria-hidden="true">↗</span></button><span className={`status ${state}`} role="status" aria-live="polite">{state === 'idle' ? 'Idle' : state === 'running' ? 'Running' : state === 'done' ? 'Demo complete' : 'Failed'}</span></div>
              {error && <p className="error" role="alert">{error}</p>}
              {run && <p className="muted small">Run {run.id} · Started {new Date(run.startedAt).toLocaleString()} · Ticket {run.ticket.id}</p>}
            </section>
            <section id="results" className="panel" aria-labelledby="results-title">
              <div className="section-heading"><span className="number">03</span><div><p className="eyebrow">FIVE SEPARATE OUTPUTS</p><h2 id="results-title">Results</h2></div></div>
              {!run && <p className="empty">Start a sample run or select one from History to inspect its results.</p>}
              {run && state === 'running' && <p className="empty" role="status">Preparing sample outputs for {run.ticket.id}…</p>}
              {run && state === 'failed' && <p className="error" role="alert">Run incomplete. {run.failedStep ? `Failed step: ${run.failedStep}. ` : ''}{run.error ?? error} Available outputs remain below.</p>}
              {run && state === 'done' && <p className="notice">Sample outputs only — not validated analysis or approved decisions. Human review and decision recording are not implemented.</p>}
              {run?.outputs.map((output, index) => <article className="output" key={output.type}>
                <div className="output-title"><span className="output-index">0{index + 1}</span><h3>{labels[output.type]}</h3><span className={`tag ${output.status}`}>{output.status}</span></div>
                <p className="detail">{output.detail}</p><p className="muted">{output.rationale}</p>
                <div className="evidence"><strong>Sample evidence IDs</strong><p>{output.evidenceRefs.length ? output.evidenceRefs.join(' · ') : 'No applicable source found'}</p>{output.missingFacts.length > 0 && <p><strong>Missing:</strong> {output.missingFacts.join(' · ')}</p>}</div>
              </article>)}
            </section>
          </div>
          <aside id="history" className="panel history" aria-labelledby="history-title">
            <div className="section-heading"><span className="number">04</span><div><p className="eyebrow">THIS BROWSER ONLY</p><h2 id="history-title">History</h2></div></div>
            <p className="muted small">Synthetic run metadata is kept in this browser's local storage. No reviewer decisions are recorded.</p>
            {history.length === 0 ? <p className="empty">No sample runs yet.</p> : <ul className="history-list">{history.map((item) => <li key={item.id}><button type="button" className="history-item" onClick={() => selectRun(item)} disabled={state === 'running'} aria-label={`View run for ${item.ticket.id} started ${new Date(item.startedAt).toLocaleString()}`}><strong>{item.ticket.id}</strong><span>{item.ticket.subject}</span><small>{new Date(item.startedAt).toLocaleString()} · {item.status === 'analyzing' ? 'Running' : item.status === 'failed' ? 'Failed' : 'Demo complete'}</small></button></li>)}</ul>}
          </aside>
        </div>
      </main>
      <footer>LOCAL DEMO / SYNTHETIC CASES ONLY <span>Human review required before any real-world use.</span></footer>
    </div>
  );
}
