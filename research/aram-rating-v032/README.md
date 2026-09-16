# ARAM Rating v0.3.2 Research

Accuracy-first research branch for ARAM rating calibration and match-network expansion.

## Current B5.1 recovery status

- R2: one-shot external target request accepted.
- R3: original legacy request shape accepted on anchor 1.
- R4: same shape accepted on anchor 2.
- R5: anchors 1 -> 2 accepted sequentially in one session.
- R6: preserved legacy checkpoint forensic proved 15/15 anchors failed 3 times each (45 HTTP 400 requests) and were incorrectly marked completed.
- R7: read-only repair preview confirmed all 15 false completions should be requeued.
- R8: guarded checkpoint repair requeued all 15 without changing the 1982 stored matches.
- R9: guarded one-anchor recovery succeeded on the user PC; 20 valid target matches returned, 18 duplicates, 2 new unique matches accepted. Checkpoint advanced 1982 -> 1984, completed 0 -> 1, remaining 15 -> 14, with prior-match integrity preserved.
- R10: guarded three-anchor bounded recovery prepared. Exact R9 state is required; maximum 3 requests, no retries, stop on first request/validation failure, and per-anchor rollback on postcondition failure.

## Safety

- Research-only; not shipped in the production manifest.
- Automatic collection remains disabled.
- Production rating activation remains disabled.
- Destructive reset/migration is forbidden.
- Live collection requires explicit manual confirmation.
- Privacy-safe evidence does not store raw PUUIDs or Riot IDs.

## Next step

Run R10 on the user PC, then evaluate checkpoint growth and closed-network quality before widening recovery or activating any production rating path.
