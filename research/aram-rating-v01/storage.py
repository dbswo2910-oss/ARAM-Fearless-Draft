from __future__ import annotations
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import sqlite3
import time
from typing import List, Optional, Sequence, Tuple

STANDARD_ARAM_QUEUE_ID = 450

@dataclass(frozen=True)
class Match:
    match_id: str
    game_datetime: int
    duration: int
    patch: str
    queue_id: int
    team_a_id: int
    team_b_id: int
    team_a: Tuple[int, ...]
    team_b: Tuple[int, ...]
    team_a_win: bool

def connect(path: str | Path) -> sqlite3.Connection:
    db=sqlite3.connect(str(path))
    db.row_factory=sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('PRAGMA journal_mode=WAL')
    return db

def init_db(db: sqlite3.Connection, schema_path: str | Path) -> None:
    db.executescript(Path(schema_path).read_text(encoding='utf-8'))
    now=int(time.time()*1000)
    db.execute("""INSERT OR IGNORE INTO crawl_checkpoint
                  (checkpoint_id,calls_used,matches_saved,players_seen,max_depth_seen,cooldown_until,updated_at,note)
                  VALUES(1,0,0,0,0,0,?,'init')""",(now,))
    db.commit()

def _norm_participant(p: dict) -> dict:
    puuid=str(p.get('puuid') or '').strip()
    if not puuid:
        raise ValueError('participant missing puuid')
    team=int(p.get('team_id',p.get('teamId',0)) or 0)
    if not team:
        raise ValueError(f'participant {puuid[:8]} missing team_id')
    return {
        'puuid':puuid,
        'riot_id':p.get('riot_id') or p.get('game_name') or p.get('gameName'),
        'tag':p.get('tag') or p.get('tag_line') or p.get('tagLine'),
        'team_id':team,
        'champion_id':p.get('champion_id',p.get('championId')),
        'champion_name':p.get('champion_name',p.get('championName')),
        'win':bool(p.get('win')),
        'kills':p.get('kills'),'deaths':p.get('deaths'),'assists':p.get('assists'),
        'damage':p.get('damage',p.get('totalDamageDealtToChampions')),
        'damage_taken':p.get('damage_taken',p.get('totalDamageTaken')),
        'healing':p.get('healing',p.get('totalHealsOnTeammates',p.get('totalHeal'))),
        'shielding':p.get('shielding',p.get('totalDamageShieldedOnTeammates')),
        'gold':p.get('gold',p.get('goldEarned')),
        'party_id':p.get('party_id'),'party_source':p.get('party_source'),
        'raw_json':json.dumps(p,separators=(',',':'),ensure_ascii=False)
    }

def normalize_match(payload: dict, source: str='import') -> dict:
    match_id=str(payload.get('match_id') or payload.get('matchId') or payload.get('gameId') or '').strip()
    if not match_id:
        raise ValueError('match missing match_id')
    queue_id=int(payload.get('queue_id',payload.get('queueId',0)) or 0)
    if queue_id != STANDARD_ARAM_QUEUE_ID:
        raise ValueError(f'{match_id}: queue {queue_id} is not standard ARAM 450')
    ts=int(payload.get('game_datetime',payload.get('gameEndTimestamp',payload.get('gameCreation',payload.get('gameStartTimestamp',0)))) or 0)
    if ts<=0:
        raise ValueError(f'{match_id}: missing game_datetime')
    if ts < 10_000_000_000:
        ts *= 1000
    duration=int(payload.get('duration',payload.get('gameDuration',0)) or 0)
    if duration > 100000:
        duration //= 1000
    parts=[_norm_participant(x) for x in (payload.get('participants') or [])]
    if len(parts)!=10:
        raise ValueError(f'{match_id}: expected 10 participants, got {len(parts)}')
    teams={}
    for p in parts:
        teams.setdefault(p['team_id'],[]).append(p)
    if len(teams)!=2 or sorted(len(v) for v in teams.values()) != [5,5]:
        raise ValueError(f'{match_id}: expected 5v5 teams, got {[len(v) for v in teams.values()]}')
    wins={tid:{bool(p['win']) for p in ps} for tid,ps in teams.items()}
    if any(len(x)!=1 for x in wins.values()) or sum(next(iter(x)) for x in wins.values())!=1:
        raise ValueError(f'{match_id}: inconsistent win flags')
    patch=str(payload.get('patch') or payload.get('gameVersion') or '').strip()
    return {
        'match_id':match_id,'game_datetime':ts,'duration':duration,'patch':patch,
        'queue_id':queue_id,'queue_type':'ARAM','source':str(payload.get('source') or source),
        'participants':parts,'raw_json':json.dumps(payload,separators=(',',':'),ensure_ascii=False)
    }

def _upsert_player(db: sqlite3.Connection, p: dict, region='KR', now=None) -> int:
    now=int(now or time.time()*1000)
    db.execute("""INSERT INTO players(puuid,riot_id,tag,region,first_seen,last_updated)
                  VALUES(?,?,?,?,?,?)
                  ON CONFLICT(puuid) DO UPDATE SET
                    riot_id=COALESCE(excluded.riot_id,players.riot_id),
                    tag=COALESCE(excluded.tag,players.tag),
                    last_updated=MAX(players.last_updated,excluded.last_updated)""",
               (p['puuid'],p['riot_id'],p['tag'],region,now,now))
    row=db.execute('SELECT player_id FROM players WHERE puuid=?',(p['puuid'],)).fetchone()
    return int(row['player_id'])

def insert_match(db: sqlite3.Connection, payload: dict, source='import') -> dict:
    m=normalize_match(payload,source=source)
    now=int(time.time()*1000)
    existed=db.execute('SELECT 1 FROM matches WHERE match_id=?',(m['match_id'],)).fetchone() is not None
    if existed:
        return {'inserted':False,'match_id':m['match_id'],'players_added':0}
    before=int(db.execute('SELECT COUNT(*) n FROM players').fetchone()['n'])
    with db:
        db.execute("""INSERT INTO matches(match_id,game_datetime,duration,patch,queue_id,queue_type,source,raw_json,inserted_at)
                      VALUES(?,?,?,?,?,?,?,?,?)""",
                   (m['match_id'],m['game_datetime'],m['duration'],m['patch'],m['queue_id'],m['queue_type'],m['source'],m['raw_json'],now))
        for p in m['participants']:
            pid=_upsert_player(db,p,now=now)
            db.execute("""INSERT INTO match_players
                          (match_id,player_id,team_id,champion_id,champion_name,win,kills,deaths,assists,
                           damage,damage_taken,healing,shielding,gold,party_id,party_source,raw_json)
                          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                       (m['match_id'],pid,p['team_id'],p['champion_id'],p['champion_name'],1 if p['win'] else 0,
                        p['kills'],p['deaths'],p['assists'],p['damage'],p['damage_taken'],p['healing'],
                        p['shielding'],p['gold'],p['party_id'],p['party_source'],p['raw_json']))
    after=int(db.execute('SELECT COUNT(*) n FROM players').fetchone()['n'])
    return {'inserted':True,'match_id':m['match_id'],'players_added':after-before}

def import_jsonl(db: sqlite3.Connection, path: str | Path, source='jsonl') -> dict:
    inserted=duplicates=rejected=players_added=0
    errors=[]
    with open(path,'r',encoding='utf-8') as f:
        for lineno,line in enumerate(f,1):
            line=line.strip()
            if not line: continue
            try:
                r=insert_match(db,json.loads(line),source=source)
                if r['inserted']:
                    inserted+=1; players_added+=r['players_added']
                else:
                    duplicates+=1
            except Exception as e:
                rejected+=1
                if len(errors)<25: errors.append({'line':lineno,'error':str(e)})
    return {'inserted':inserted,'duplicates':duplicates,'rejected':rejected,'players_added':players_added,'errors':errors}

def load_matches(db: sqlite3.Connection) -> List[Match]:
    rows=db.execute("""SELECT m.match_id,m.game_datetime,m.duration,m.patch,m.queue_id,
                      mp.player_id,mp.team_id,mp.win
                      FROM matches m JOIN match_players mp ON mp.match_id=m.match_id
                      WHERE m.queue_id=?
                      ORDER BY m.game_datetime ASC,m.match_id ASC,mp.team_id ASC,mp.player_id ASC""",
                    (STANDARD_ARAM_QUEUE_ID,)).fetchall()
    grouped={}
    for r in rows:
        grouped.setdefault(r['match_id'],{'meta':r,'parts':[]})['parts'].append(r)
    out=[]
    for mid,g in grouped.items():
        ps=g['parts']; teams={}
        for p in ps: teams.setdefault(int(p['team_id']),[]).append(p)
        if len(teams)!=2: continue
        a,b=sorted(teams)
        aa=teams[a];bb=teams[b]
        if len(aa)!=5 or len(bb)!=5: continue
        out.append(Match(
            match_id=mid,game_datetime=int(g['meta']['game_datetime']),duration=int(g['meta']['duration']),
            patch=str(g['meta']['patch'] or ''),queue_id=int(g['meta']['queue_id']),
            team_a_id=a,team_b_id=b,team_a=tuple(int(x['player_id']) for x in aa),
            team_b=tuple(int(x['player_id']) for x in bb),team_a_win=bool(int(aa[0]['win']))
        ))
    out.sort(key=lambda x:(x.game_datetime,x.match_id))
    return out

def dataset_fingerprint(matches: Sequence[Match]) -> str:
    h=hashlib.sha256()
    for m in matches:
        h.update(f"{m.match_id}|{m.game_datetime}|{m.team_a_id}:{','.join(map(str,m.team_a))}|{m.team_b_id}:{','.join(map(str,m.team_b))}|{int(m.team_a_win)}\n".encode())
    return h.hexdigest()

def database_stats(db: sqlite3.Connection) -> dict:
    match_n=int(db.execute('SELECT COUNT(*) n FROM matches').fetchone()['n'])
    player_n=int(db.execute('SELECT COUNT(*) n FROM players').fetchone()['n'])
    mp_n=int(db.execute('SELECT COUNT(*) n FROM match_players').fetchone()['n'])
    rng=db.execute('SELECT MIN(game_datetime) lo,MAX(game_datetime) hi FROM matches').fetchone()
    dup_puuid=int(db.execute("""SELECT COUNT(*) n FROM
        (SELECT puuid,COUNT(*) c FROM players GROUP BY puuid HAVING c>1)""").fetchone()['n'])
    dup_match=int(db.execute("""SELECT COUNT(*) n FROM
        (SELECT match_id,COUNT(*) c FROM matches GROUP BY match_id HAVING c>1)""").fetchone()['n'])
    invalid_q=int(db.execute('SELECT COUNT(*) n FROM matches WHERE queue_id<>?',(STANDARD_ARAM_QUEUE_ID,)).fetchone()['n'])
    invalid_rosters=int(db.execute("""SELECT COUNT(*) n FROM (
        SELECT match_id FROM (
          SELECT match_id,team_id,COUNT(*) team_n FROM match_players GROUP BY match_id,team_id
        ) teams GROUP BY match_id
        HAVING COUNT(*)<>2 OR SUM(team_n)<>10 OR MIN(team_n)<>5 OR MAX(team_n)<>5
    )""").fetchone()['n'])
    return {'matches':match_n,'players':player_n,'match_players':mp_n,
            'min_time':rng['lo'],'max_time':rng['hi'],'duplicate_puuid_groups':dup_puuid,
            'duplicate_match_groups':dup_match,'invalid_queue_matches':invalid_q,
            'invalid_rosters':invalid_rosters}

def audit_dataset(db: sqlite3.Connection) -> dict:
    s=database_stats(db)
    issues=[]
    if s['duplicate_puuid_groups']: issues.append('duplicate puuid groups')
    if s['duplicate_match_groups']: issues.append('duplicate match ids')
    if s['invalid_queue_matches']: issues.append('non-450 queue rows')
    if s['invalid_rosters']: issues.append('non-5v5 rosters')
    duplicate_player_match=int(db.execute("""SELECT COUNT(*) n FROM (
        SELECT match_id,player_id,COUNT(*) c FROM match_players
        GROUP BY match_id,player_id HAVING c>1)""").fetchone()['n'])
    if duplicate_player_match: issues.append('same player duplicated inside match')
    return {'ok':not issues,'issues':issues,'stats':s}

class Frontier:
    """Persistence-only crawl frontier. It deliberately performs no network I/O."""
    def __init__(self, db: sqlite3.Connection, max_matches=10000, max_players=50000,
                 max_depth=4, max_calls=50000, retry_limit=3, cooldown_ms=1000):
        self.db=db
        self.max_matches=int(max_matches);self.max_players=int(max_players)
        self.max_depth=int(max_depth);self.max_calls=int(max_calls)
        self.retry_limit=int(retry_limit);self.cooldown_ms=int(cooldown_ms)

    def checkpoint(self):
        return dict(self.db.execute('SELECT * FROM crawl_checkpoint WHERE checkpoint_id=1').fetchone())

    def enqueue(self, puuid: str, depth: int, discovered_from_match: Optional[str]=None):
        puuid=str(puuid).strip()
        if not puuid or depth>self.max_depth: return False
        now=int(time.time()*1000)
        cur=self.db.execute("""INSERT OR IGNORE INTO crawl_frontier
            (puuid,depth,status,discovered_from_match,attempts,next_attempt_at,updated_at)
            VALUES(?,?,'pending',?,0,0,?)""",(puuid,int(depth),discovered_from_match,now))
        self.db.commit()
        return cur.rowcount == 1

    def can_continue(self) -> tuple[bool,str]:
        cp=self.checkpoint();counts=database_stats(self.db);now=int(time.time()*1000)
        if counts['matches']>=self.max_matches:return False,'max_matches'
        if counts['players']>=self.max_players:return False,'max_players'
        if int(cp['calls_used'])>=self.max_calls:return False,'max_calls'
        if int(cp['cooldown_until'])>now:return False,'cooldown'
        return True,'ok'

    def recover_stale_inflight(self, stale_after_ms: int=300000):
        now=int(time.time()*1000);cutoff=now-max(1000,int(stale_after_ms))
        with self.db:
            cur=self.db.execute("""UPDATE crawl_frontier SET status='pending',updated_at=?
                WHERE status='inflight' AND updated_at<?""",(now,cutoff))
        return int(cur.rowcount or 0)

    def claim(self):
        ok,reason=self.can_continue()
        if not ok:return None
        self.recover_stale_inflight();now=int(time.time()*1000)
        row=self.db.execute("""SELECT * FROM crawl_frontier
          WHERE status='pending' AND attempts<? AND next_attempt_at<=? AND depth<=?
          ORDER BY depth ASC,updated_at ASC LIMIT 1""",(self.retry_limit,now,self.max_depth)).fetchone()
        if not row:return None
        with self.db:
            self.db.execute("UPDATE crawl_frontier SET status='inflight',updated_at=? WHERE puuid=?",(now,row['puuid']))
        return dict(row)

    def mark_done(self, puuid: str, calls_used: int=0):
        now=int(time.time()*1000)
        with self.db:
            self.db.execute("UPDATE crawl_frontier SET status='done',updated_at=? WHERE puuid=?",(now,puuid))
            self.db.execute("""UPDATE crawl_checkpoint SET calls_used=calls_used+?,
                matches_saved=(SELECT COUNT(*) FROM matches),players_seen=(SELECT COUNT(*) FROM players),
                max_depth_seen=COALESCE((SELECT MAX(depth) FROM crawl_frontier),0),updated_at=? WHERE checkpoint_id=1""",
                (int(calls_used),now))

    def mark_error(self, puuid: str, error: str, retry_after_ms: int=0):
        now=int(time.time()*1000)
        row=self.db.execute('SELECT attempts FROM crawl_frontier WHERE puuid=?',(puuid,)).fetchone()
        attempts=(int(row['attempts']) if row else 0)+1
        status='failed' if attempts>=self.retry_limit else 'pending'
        next_at=now+max(self.cooldown_ms,int(retry_after_ms or 0))
        with self.db:
            self.db.execute("""UPDATE crawl_frontier SET status=?,attempts=?,next_attempt_at=?,
                last_error=?,updated_at=? WHERE puuid=?""",(status,attempts,next_at,str(error)[:500],now,puuid))
            self.db.execute("""UPDATE crawl_checkpoint SET calls_used=calls_used+1,
                cooldown_until=MAX(cooldown_until,?),updated_at=? WHERE checkpoint_id=1""",
                (next_at if retry_after_ms else 0,now))
