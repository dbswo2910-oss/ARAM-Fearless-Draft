from __future__ import annotations
import json
from typing import Iterator


def _pick(*xs):
    for x in xs:
        if x is not None:
            return x
    return None


def _game_list(payload):
    if isinstance(payload,list): return payload
    if not isinstance(payload,dict): return []
    for k in ('games','matches','history','rows'):
        v=payload.get(k)
        if isinstance(v,list): return v
        if isinstance(v,dict):
            for kk in ('games','matches'):
                if isinstance(v.get(kk),list): return v[kk]
    return [payload] if ('gameId' in payload or 'matchId' in payload) else []


def _current_program_participants(game: dict) -> list[dict]:
    """Return participant rows from either raw LCU or the current Match Lab shape.

    The current desktop Match Lab emits five `team` rows plus five `enemy` rows,
    each with a nested `player` identity object. Older/raw LCU rows expose
    `participants` plus optional `participantIdentities`. This adapter accepts
    both without inventing missing identity data.
    """
    ps=game.get('participants')
    if isinstance(ps,list) and ps:
        return ps
    team=game.get('team') if isinstance(game.get('team'),list) else []
    enemy=game.get('enemy') if isinstance(game.get('enemy'),list) else []
    if team or enemy:
        return [*team,*enemy]
    return []


def normalize_current_program_game(game: dict) -> dict:
    """Translate Match Lab/LCU shapes already handled by the app.

    A stable PUUID is mandatory. If a row lacks PUUID identity for any
    participant, the match is rejected rather than inventing an identity.
    """
    identities={}
    for x in game.get('participantIdentities') or []:
        pid=int(x.get('participantId') or 0)
        player=x.get('player') or {}
        identities[pid]=player
    out=[]
    for p in _current_program_participants(game):
        st=p.get('stats') if isinstance(p.get('stats'),dict) else {}
        pid=int(p.get('participantId') or 0)
        nested=p.get('player') if isinstance(p.get('player'),dict) else {}
        ident=identities.get(pid,{})
        puuid=str(_pick(p.get('puuid'),nested.get('puuid'),ident.get('puuid'),ident.get('PUUID')) or '').strip()
        if not puuid:
            raise ValueError(f"{game.get('gameId')}: participant {pid or '?'} has no stable PUUID")
        riot_id=_pick(p.get('riotId'),nested.get('riotId'),ident.get('riotId'))
        game_name=_pick(p.get('gameName'),nested.get('gameName'),nested.get('displayName'),ident.get('gameName'))
        tag=_pick(p.get('tagLine'),nested.get('tagLine'),ident.get('tagLine'))
        if not riot_id and game_name:
            riot_id=game_name
        champion=p.get('champion') if isinstance(p.get('champion'),dict) else {}
        out.append({
            'puuid':puuid,'riot_id':riot_id,'tag':tag,
            'team_id':int(_pick(p.get('teamId'),st.get('teamId'),0) or 0),
            'champion_id':_pick(p.get('championId'),champion.get('id'),st.get('championId')),
            'champion_name':_pick(p.get('championName'),champion.get('name'),st.get('championName')),
            'win':bool(_pick(p.get('win'),st.get('win'),False)),
            'kills':_pick(p.get('kills'),st.get('kills')),
            'deaths':_pick(p.get('deaths'),st.get('deaths')),
            'assists':_pick(p.get('assists'),st.get('assists')),
            'damage':_pick(p.get('totalDamageDealtToChampions'),p.get('damageToChampions'),st.get('totalDamageDealtToChampions')),
            'damage_taken':_pick(p.get('totalDamageTaken'),st.get('totalDamageTaken')),
            'healing':_pick(p.get('totalHealsOnTeammates'),st.get('totalHealsOnTeammates'),p.get('totalHeal'),st.get('totalHeal')),
            'shielding':_pick(p.get('totalDamageShieldedOnTeammates'),st.get('totalDamageShieldedOnTeammates')),
            'gold':_pick(p.get('goldEarned'),st.get('goldEarned'))
        })
    q=int(_pick(game.get('queueId'),game.get('queue_id'),0) or 0)
    return {
        'match_id':str(_pick(game.get('matchId'),game.get('gameId')) or ''),
        'game_datetime':int(_pick(game.get('gameEndTimestamp'),game.get('gameCreation'),game.get('gameStartTimestamp'),0) or 0),
        'duration':int(_pick(game.get('gameDuration'),game.get('duration'),0) or 0),
        'patch':str(_pick(game.get('gameVersion'),game.get('patch'),'') or ''),
        'queue_id':q,
        'source':'current-program-lcu-import',
        'participants':out
    }


def iter_normalized(payload) -> Iterator[dict]:
    for g in _game_list(payload):
        yield normalize_current_program_game(g)


def convert_file(input_path, output_path):
    payload=json.load(open(input_path,'r',encoding='utf-8'))
    with open(output_path,'w',encoding='utf-8') as f:
        n=0
        for row in iter_normalized(payload):
            f.write(json.dumps(row,ensure_ascii=False,separators=(',',':'))+'\n');n+=1
    return n
