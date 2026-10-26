# Customer Support Crew frontend

Local synthetic-only single-route React/TypeScript review console. The Run button calls the local backend's deterministic mock workflow; no review decisions or external actions are available. See [frontend functional spec](../project-context/2.build/frontend-functional-spec.md) for boundaries and the Spec Sync checklist to update after every commit.

Start the backend from the repository root in one terminal:

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

With Node.js and npm installed, start the frontend from `frontend/` in another terminal:

```bash
npm install
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:8000/*` during development. Open the local URL shown by Vite. To validate:

```bash
npm test
npm run build
```

The browser stores only run IDs for its History index; run details and validated outputs are loaded from the backend's local trace. Clearing site data removes that browser's History index but does not delete backend traces. Five output cards follow T1a → T1b → T2 → T3a → T3b order; T2 is coordinator-only, not a fifth CrewAI task. The local backend uses a deterministic mock and has no hosted model, live data, or outbound action capability. Production hosting needs an explicitly configured same-origin API proxy; the Vite proxy is development-only. Reviewer decision and revision controls are not implemented.
