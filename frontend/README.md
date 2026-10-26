# Customer Support Crew frontend

Local synthetic-only single-route React/TypeScript preview. The Run button produces **sample fixture output**, not actual crew analysis; no review decisions or external actions are available. See [frontend functional spec](../project-context/2.build/frontend-functional-spec.md) for boundaries and the Spec Sync checklist to update after every commit.

With Node.js and npm installed:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. To validate:

```bash
npm test
npm run build
```

The stub service persists synthetic run metadata in browser localStorage. Clearing site data clears History. Replace `src/services/runs.ts` with an approved local integration before treating results as reviewable analysis.
