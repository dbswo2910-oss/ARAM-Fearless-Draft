from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re
import sys
import time
from typing import Iterable, Iterator

HERE = Path(__file__).resolve().parent
V01 = HERE.parent / 'aram-rating-v01'
sys.path.insert(0, str(V01))

from program_import import normalize_current_program_game

PATCH_RE = re.compile(r'^\d{1,3}\.\d{1,3}(?:\.\d{1,4})?(?:[-+._A-Za-z0-9]*)?$')


@dataclass(frozen=True)
class AuditConfig:
    min_duration_seconds: int = 180
    future_grace_seconds: int = 300
    max_champion_id: int = 10000
    require_patch: bool = True


def _pick(*xs):
    for x in xs:
        if x is not None:
            return x
    return None


def _extract_games(payload) -> list[dict]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ('matches', 'games', 'history', 'rows'):
        value = payload.get(key)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]
        if isinstance(value, dict):
            for inner in ('matches', 'games', 'rows'):
                rows = value.get(inner)
                if isinstance(rows, list):
                    return [x for x in rows if isinstance(x, dict)]
    if any(k in payload for k in ('match_id', 'matchId', 'gameId')):
        return [payload]
    return []


def load_records(path: str | Path) -> list[dict]:
    path = Path(path)
    if path.suffix.lower() in {'.jsonl', '.ndjson'}:
        out = []
        with path.open('r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    obj = json.loads(line)
                    if isinstance(obj, dict):
                        out.append(obj)
        return out
    return _extract_games(json.loads(path.read_text(encoding='utf-8')))


def _already_normalized(game: dict) -> bool:
    parts = game.get('participants')
    if not isinstance(parts, list):
        return False
    return bool(game.get('match_id') or game.get('matchId')) and any(
        isinstance(p, dict) and ('puuid' in p) for p in parts
    )


def normalize_for_audit(game: dict) -> dict:
    if _already_normalized(game):
        parts = []
        for p in game.get('participants') or []:
            if not isinstance(p, dict):
                continue
            parts.append({
                'puuid': str(p.get('puuid') or '').strip(),
                'riot_id': _pick(p.get('riot_id'), p.get('riotId'), p.get('gameName')),
                'tag': _pick(p.get('tag'), p.get('tagLine')),
                'team_id': int(_pick(p.get('team_id'), p.get('teamId'), 0) or 0),
                'champion_id': _pick(p.get('champion_id'), p.get('championId')),
                'champion_name': _pick(p.get('champion_name'), p.get('championName')),
                'win': bool(p.get('win')),
                'kills': p.get('kills'),
                'deaths': p.get('deaths'),
                'assists': p.get('assists'),
                'damage': _pick(p.get('damage'), p.get('totalDamageDealtToChampions')),
                'damage_taken': _pick(p.get('damage_taken'), p.get('totalDamageTaken')),
                'healing': _pick(p.get('healing'), p.get('totalHealsOnTeammates'), p.get('totalHeal')),
                'shielding': _pick(p.get('shielding'), p.get('totalDamageShieldedOnTeammates')),
                'gold': _pick(p.get('gold'), p.get('goldEarned')),
                'party_id': p.get('party_id'),
                'party_source': p.get('party_source'),
            })
        return {
            'match_id': str(_pick(game.get('match_id'), game.get('matchId'), game.get('gameId')) or '').strip(),
            'queue_id': int(_pick(game.get('queue_id'), game.get('queueId'), 0) or 0),
            'game_datetime': int(_pick(game.get('game_datetime'), game.get('gameEndTimestamp'), game.get('gameCreation'), game.get('gameStartTimestamp'), 0) or 0),
            'duration': int(_pick(game.get('duration'), game.get('gameDuration'), 0) or 0),
            'patch': str(_pick(game.get('patch'), game.get('gameVersion'), '') or '').strip(),
            'source': str(game.get('source') or 'existing-program-export'),
            'participants': parts,
        }
    return normalize_current_program_game(game)


def _canonical_digest(row: dict) -> str:
    body = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(body.encode('utf-8')).hexdigest()


def _validate(row: dict, config: AuditConfig, now_ms: int) -> tuple[list[str], list[str]]:
    reasons: list[str] = []
    warnings: list[str] = []
    mid = str(row.get('match_id') or '').strip()
    if not mid:
        reasons.append('missing_match_id')
    if int(row.get('queue_id') or 0) != 450:
        reasons.append('invalid_queue')

    ts = int(row.get('game_datetime') or 0)
    if ts and ts < 10_000_000_000:
        ts *= 1000
        row['game_datetime'] = ts
    if ts <= 0:
        reasons.append('invalid_timestamp')
    elif ts > now_ms + config.future_grace_seconds * 1000:
        reasons.append('future_timestamp')

    duration = int(row.get('duration') or 0)
    if duration > 100000:
        duration //= 1000
        row['duration'] = duration
    if duration <= 0:
        reasons.append('invalid_duration')
    elif duration < config.min_duration_seconds:
        reasons.append('remake_or_too_short')

    patch = str(row.get('patch') or '').strip()
    if not patch:
        if config.require_patch:
            reasons.append('missing_patch')
        else:
            warnings.append('missing_patch')
    elif not PATCH_RE.match(patch):
        reasons.append('unparseable_patch')

    parts = row.get('participants') or []
    if len(parts) != 10:
        reasons.append('participant_count_not_10')
        return reasons, warnings

    puuids = [str(p.get('puuid') or '').strip() for p in parts]
    if any(not x for x in puuids):
        reasons.append('missing_puuid')
    if len(set(x for x in puuids if x)) != len([x for x in puuids if x]):
        reasons.append('duplicate_puuid_in_match')

    teams: dict[int, list[dict]] = {}
    for p in parts:
        tid = int(p.get('team_id') or 0)
        teams.setdefault(tid, []).append(p)
    if len(teams) != 2 or sorted(len(v) for v in teams.values()) != [5, 5] or 0 in teams:
        reasons.append('invalid_team_structure')
    else:
        team_wins = []
        for ps in teams.values():
            flags = {bool(p.get('win')) for p in ps}
            if len(flags) != 1:
                reasons.append('inconsistent_team_win_flags')
                break
            team_wins.append(next(iter(flags)))
        if len(team_wins) == 2 and sum(bool(x) for x in team_wins) != 1:
            reasons.append('invalid_winner_structure')

    for p in parts:
        cid = p.get('champion_id')
        if cid is None or cid == '':
            warnings.append('missing_champion_id')
            continue
        try:
            n = int(cid)
        except (TypeError, ValueError):
            reasons.append('invalid_champion_id')
            break
        if n <= 0 or n > config.max_champion_id:
            reasons.append('invalid_champion_id')
            break

    return sorted(set(reasons)), sorted(set(warnings))


def audit_records(records: Iterable[dict], config: AuditConfig | None = None, now_ms: int | None = None) -> tuple[list[dict], dict]:
    config = config or AuditConfig()
    now_ms = int(now_ms or time.time() * 1000)
    accepted: list[dict] = []
    reject_reasons = Counter()
    warning_reasons = Counter()
    seen: dict[str, str] = {}
    raw_count = rejected = duplicates = conflicting = 0
    examples = []

    for index, raw in enumerate(records, 1):
        raw_count += 1
        try:
            row = normalize_for_audit(raw)
        except Exception as exc:
            rejected += 1
            reject_reasons['normalization_error'] += 1
            if len(examples) < 30:
                examples.append({'row': index, 'reasons': ['normalization_error'], 'detail': str(exc)})
            continue

        reasons, warnings = _validate(row, config, now_ms)
        mid = str(row.get('match_id') or '').strip()
        digest = _canonical_digest(row)
        if mid and mid in seen:
            rejected += 1
            duplicates += 1
            reason = 'duplicate_match_id' if seen[mid] == digest else 'conflicting_match_version'
            if reason == 'conflicting_match_version':
                conflicting += 1
            reject_reasons[reason] += 1
            if len(examples) < 30:
                examples.append({'row': index, 'match_id': mid, 'reasons': [reason]})
            continue
        if mid:
            seen[mid] = digest

        for warning in warnings:
            warning_reasons[warning] += 1
        if reasons:
            rejected += 1
            for reason in reasons:
                reject_reasons[reason] += 1
            if len(examples) < 30:
                examples.append({'row': index, 'match_id': mid, 'reasons': reasons})
            continue
        accepted.append(row)

    participants = sum(len(x.get('participants') or []) for x in accepted)
    report = {
        'schema': 'aram-rating-data-audit-v02',
        'raw_count': raw_count,
        'accepted_count': len(accepted),
        'rejected_count': rejected,
        'duplicate_count': duplicates,
        'conflicting_duplicate_versions': conflicting,
        'participant_rows_accepted': participants,
        'reject_reasons': dict(sorted(reject_reasons.items())),
        'warning_reasons': dict(sorted(warning_reasons.items())),
        'config': {
            'queue_id': 450,
            'min_duration_seconds': config.min_duration_seconds,
            'future_grace_seconds': config.future_grace_seconds,
            'max_champion_id': config.max_champion_id,
            'require_patch': config.require_patch,
        },
        'examples': examples,
    }
    return accepted, report


def audit_file(input_path: str | Path, accepted_path: str | Path | None = None,
               audit_path: str | Path | None = None, config: AuditConfig | None = None) -> dict:
    rows = load_records(input_path)
    accepted, report = audit_records(rows, config=config)
    if accepted_path:
        p = Path(accepted_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open('w', encoding='utf-8') as f:
            for row in accepted:
                f.write(json.dumps(row, ensure_ascii=False, separators=(',', ':')) + '\n')
    if audit_path:
        p = Path(audit_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return report
