from __future__ import annotations
import math
import random


def generate_matches(match_count=1200, player_count=240, seed=20260914, start_ms=1760000000000):
    """Generate a deterministic 5v5 standard-ARAM-like dataset with latent skill.

    This is only for pipeline validation. It is never evidence that real ARAM
    has the same predictability.
    """
    rng=random.Random(seed)
    skills={i:rng.gauss(0,1) for i in range(player_count)}
    rows=[]
    for idx in range(match_count):
        selected=rng.sample(range(player_count),10)
        rng.shuffle(selected)
        a=selected[:5];b=selected[5:]
        sa=sum(skills[x] for x in a)/5
        sb=sum(skills[x] for x in b)/5
        p=1/(1+math.exp(-(sa-sb)*3.0))
        a_win=rng.random()<p
        parts=[]
        for team_id,ids,win in [(100,a,a_win),(200,b,not a_win)]:
            for pid in ids:
                base=max(0.15,skills[pid]+2.0)
                kills=max(0,int(rng.gauss(5+base,2.5)))
                deaths=max(1,int(rng.gauss(7-base*.25,2.0)))
                assists=max(0,int(rng.gauss(12+base*1.5,4)))
                dmg=max(1000,int(rng.gauss(16000+base*3200,5000)))
                taken=max(1000,int(rng.gauss(18000+max(0,2-base)*2500,5000)))
                champ=1+(pid*17+idx*7)%173
                parts.append({
                    'puuid':f'syn-puuid-{pid:05d}','riot_id':f'Synthetic{pid}','tag':'TEST',
                    'team_id':team_id,'champion_id':champ,'champion_name':f'Champion{champ}',
                    'win':win,'kills':kills,'deaths':deaths,'assists':assists,
                    'damage':dmg,'damage_taken':taken,
                    'healing':max(0,int(rng.gauss(1200,800))),
                    'shielding':max(0,int(rng.gauss(600,500))),
                    'gold':max(3000,int(rng.gauss(12000+base*700,1500)))
                })
        rows.append({
            'match_id':f'KR_SYN_{idx:07d}',
            'game_datetime':start_ms+idx*11*60*1000,
            'duration':int(rng.gauss(1050,180)),
            'patch':'SYNTHETIC','queue_id':450,'source':'synthetic',
            'participants':parts
        })
    return rows
