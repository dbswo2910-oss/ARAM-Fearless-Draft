from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable


class LocalIdentityMap:
    """Local-only PUUID -> internal ID mapping.

    The v0.1 SQLite schema still names the stable identity column `puuid` for
    compatibility, but Phase A stores only `player-internal-XXXXXX` values there.
    The raw Riot PUUID mapping is kept in an ignored local JSON file and Riot IDs
    / tags are removed before DB import.
    """

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.data = {'version': 1, 'next_id': 1, 'puuid_to_internal': {}}
        if self.path.exists():
            loaded = json.loads(self.path.read_text(encoding='utf-8'))
            if isinstance(loaded, dict) and isinstance(loaded.get('puuid_to_internal'), dict):
                self.data = loaded
                self.data.setdefault('version', 1)
                self.data.setdefault('next_id', len(self.data['puuid_to_internal']) + 1)

    def internal_id(self, puuid: str) -> str:
        puuid = str(puuid or '').strip()
        if not puuid:
            raise ValueError('cannot anonymize missing puuid')
        mapping = self.data['puuid_to_internal']
        if puuid not in mapping:
            n = int(self.data.get('next_id') or (len(mapping) + 1))
            mapping[puuid] = f'player-internal-{n:06d}'
            self.data['next_id'] = n + 1
        return mapping[puuid]

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def anonymize_matches(matches: Iterable[dict], mapping_path: str | Path) -> tuple[list[dict], dict]:
    mapper = LocalIdentityMap(mapping_path)
    out = []
    raw_puuids = set()
    for match in matches:
        row = json.loads(json.dumps(match, ensure_ascii=False))
        parts = row.get('participants') or []
        for p in parts:
            raw = str(p.get('puuid') or '').strip()
            raw_puuids.add(raw)
            p['puuid'] = mapper.internal_id(raw)
            # Riot ID / tag are not rating inputs, so do not persist them into
            # the accepted anonymized JSONL or research DB.
            p['riot_id'] = None
            p['riotId'] = None
            p['game_name'] = None
            p['gameName'] = None
            p['tag'] = None
            p['tagLine'] = None
            p['tag_line'] = None
        out.append(row)
    mapper.save()
    return out, {
        'raw_unique_puuids': len(raw_puuids),
        'internal_ids': len(mapper.data['puuid_to_internal']),
        'mapping_file': str(Path(mapping_path)),
        'db_contains_raw_puuid': False,
        'db_contains_riot_id': False,
        'mapping_local_only': True,
    }


def write_jsonl(rows: Iterable[dict], path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, separators=(',', ':')) + '\n')
