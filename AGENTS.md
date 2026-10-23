# Architecture rules
- Preserve the existing TanStack Start application and parallel Vercel SPA entry; new operational actions use transactional database RPCs so both hosting targets enforce the same rules.
- School resource inventory represents individual internal units grouped by locations; asset codes remain optional because official identifiers must not be invented.
- New resource authorization uses a protected role table, not profile metadata; legacy public features retain their current access rules.
- Reservation allocations and equipment movements are the operational source of truth; activity logs are audit outputs, never stock counters.