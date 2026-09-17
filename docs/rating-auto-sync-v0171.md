# Universal Rating Auto Sync v0.17.1

Research-only sidecar design for automatic Rating evidence refresh after a standard ARAM game ends.

- Reuses the existing AutoSync state poll; does not add a second recurring poll owner.
- Reuses the existing `match-history:load` bridge as the only history/network owner.
- Detects an observed in-game -> end/idle transition, waits briefly for history persistence, then performs a bounded latest-history refresh.
- Standard ARAM queue 450 only when the queue is known.
- Duplicate match IDs are ignored by the Universal Rating store.
- New match participants are recalculated locally across the existing Dual Shadow models with zero additional network requests.
- The frozen `aram-rating-research-v03/checkpoint-v03` evaluation checkpoint is not mutated.
- Production Rating activation and automatic model promotion remain disabled (`no_clear_winner`).
- Real Windows/League timing still requires physical acceptance testing before updater activation.

Physical acceptance gate:

1. Launch the normal app and League Client.
2. Play one standard ARAM game.
3. Confirm exactly one game-end Rating sync is triggered.
4. Confirm the Universal Rating DB gains the new match once and only once.
5. Confirm repeated post-game AutoSync polling does not add duplicates or cause request storms.
6. Confirm reconnect/disconnect transitions do not falsely ingest a match.
7. Confirm normal Match History, AutoSync, Profile, DATA, RANDOM, IN GAME and updater behavior remain intact.
