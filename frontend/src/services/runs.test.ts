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

describe('local sample run', () => {
  it('moves only through valid UI transitions', () => {
    expect(nextUiState('idle', 'complete')).toBe('idle');
    expect(nextUiState('idle', 'start')).toBe('running');
    expect(nextUiState('running', 'complete')).toBe('done');
    expect(nextUiState('running', 'fail')).toBe('failed');
    expect(nextUiState('done', 'reset')).toBe('idle');
  });

  it('rejects unknown tickets without writing a run', async () => {
    const service = createRunService(memoryStorage());
    await expect(service.startRun('UNKNOWN')).rejects.toThrow('valid synthetic ticket');
    expect(service.getHistory()).toEqual([]);
  });

  it('retains inputs, exposes five distinct outputs, and persists history', async () => {
    const storage = memoryStorage();
    const service = createRunService(storage);
    const started = await service.startRun('SYN-102');
    expect(started.status).toBe('analyzing');
    expect(started.outputs).toEqual([]);
    const saved = JSON.parse(storage.getItem('support-crew-demo-runs-v1')!);
    saved[0].startedAt = '2000-01-01T00:00:00.000Z';
    storage.setItem('support-crew-demo-runs-v1', JSON.stringify(saved));
    const completed = await service.getRunStatus(started.id);
    expect(completed.status).toBe('ready_for_review');
    expect(completed.outputs.map((output) => output.type)).toEqual([
      'classification', 'sentiment_context', 'knowledge', 'response', 'escalation',
    ]);
    expect(completed.outputs.find((output) => output.type === 'knowledge')?.status).toBe('limited');
    expect(createRunService(storage).getHistory()[0].ticket.gaps).toContain('Payment records disagree');
    await expect(service.getRunStatus('missing')).rejects.toThrow('not found');
  });
});
