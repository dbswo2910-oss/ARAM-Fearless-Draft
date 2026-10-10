"""Collection planning primitives for ARAM Rating v0.1.

There is intentionally no Riot/OP.GG HTTP scraper in this module.

Why:
- The current project already has local League Client history access, but Riot
  documents the League Client API as unsupported for third-party use.
- Riot's current General Policies prohibit products that create alternatives to
  official skill ranking systems, explicitly including MMR/ELO calculators.
- OP.GG does not provide its data as a third-party API; its help-center crawling
  guidance and platform terms need product-owner/legal reconciliation before
  any automation is shipped.

The network-expansion state machine lives in storage.Frontier so a sanctioned
provider can be attached later without changing DB or experiment code.
"""

from dataclasses import dataclass

@dataclass(frozen=True)
class CollectionLimits:
    max_matches: int = 10000
    max_players: int = 50000
    max_depth: int = 4
    max_calls: int = 50000
    retry_limit: int = 3
    cooldown_ms: int = 1000

@dataclass(frozen=True)
class ProviderCapability:
    name: str
    automated_collection_enabled: bool
    reason: str

PROVIDERS = {
    'riot_match_v5': ProviderCapability(
        'riot_match_v5', False,
        'policy review/approval gate: player-facing MMR/ELO alternatives are prohibited by current Riot General Policies'
    ),
    'opgg': ProviderCapability(
        'opgg', False,
        'no sanctioned data API assumed; automated crawling is intentionally not implemented'
    ),
    'existing_program_import': ProviderCapability(
        'existing_program_import', True,
        'imports user-supplied/current-program match envelopes only; no network expansion'
    ),
}
