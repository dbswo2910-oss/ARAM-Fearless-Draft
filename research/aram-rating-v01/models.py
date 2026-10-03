from __future__ import annotations
from dataclasses import dataclass
import copy
import math
from typing import Dict, Iterable, Sequence

EPS = 1e-12

def _normal_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

def _normal_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def _clip_prob(p: float) -> float:
    return min(1.0 - 1e-9, max(1e-9, float(p)))

@dataclass
class RatingView:
    rating: float
    uncertainty: float
    games: int

class BaseTeamModel:
    name = "base"
    version = "0.1"

    def clone(self):
        return copy.deepcopy(self)

    def predict(self, team_a: Sequence[int], team_b: Sequence[int]) -> float:
        raise NotImplementedError

    def update(self, team_a: Sequence[int], team_b: Sequence[int], team_a_win: bool) -> None:
        raise NotImplementedError

    def view(self, player_id: int) -> RatingView:
        raise NotImplementedError

    def team_rating(self, team: Sequence[int]) -> float:
        values = [self.view(pid).rating for pid in team]
        return sum(values) / max(1, len(values))

    def team_uncertainty(self, team: Sequence[int]) -> float:
        vals = [self.view(pid).uncertainty for pid in team]
        return math.sqrt(sum(v*v for v in vals)) / max(1, len(vals))

    def states(self, player_ids: Iterable[int]) -> Dict[int, RatingView]:
        return {int(pid): self.view(int(pid)) for pid in player_ids}

class TeamElo(BaseTeamModel):
    name = "elo"

    @dataclass
    class State:
        rating: float = 1500.0
        games: int = 0

    def __init__(self, k: float = 24.0, scale: float = 400.0):
        self.k = float(k)
        self.scale = float(scale)
        self._s: Dict[int, TeamElo.State] = {}

    def _get(self, pid: int) -> State:
        return self._s.setdefault(int(pid), self.State())

    def predict(self, team_a, team_b) -> float:
        ra = sum(self._get(p).rating for p in team_a) / len(team_a)
        rb = sum(self._get(p).rating for p in team_b) / len(team_b)
        return _clip_prob(1.0 / (1.0 + 10.0 ** (-(ra-rb)/self.scale)))

    def update(self, team_a, team_b, team_a_win: bool) -> None:
        p = self.predict(team_a, team_b)
        score = 1.0 if team_a_win else 0.0
        delta = self.k * (score - p)
        for pid in team_a:
            s=self._get(pid); s.rating += delta; s.games += 1
        for pid in team_b:
            s=self._get(pid); s.rating -= delta; s.games += 1

    def view(self, player_id: int) -> RatingView:
        s=self._get(player_id)
        u=max(35.0, 350.0/math.sqrt(max(1, s.games+1)))
        return RatingView(s.rating,u,s.games)

class TeamGlicko(BaseTeamModel):
    """Glicko-1-family approximation for a 5v5 match.

    Each player observes the opposing team's mean rating as a pseudo-opponent.
    The opposing RD is the standard error of the opposing team mean.
    Updates for all 10 players are computed from the same pre-match snapshot.
    """
    name = "glicko"

    @dataclass
    class State:
        rating: float = 1500.0
        rd: float = 350.0
        games: int = 0

    def __init__(self, rd_floor: float = 45.0, rd_drift: float = 10.0):
        self.rd_floor=float(rd_floor)
        self.rd_drift=float(rd_drift)
        self.q=math.log(10.0)/400.0
        self._s: Dict[int, TeamGlicko.State] = {}

    def _get(self,pid:int)->State:
        return self._s.setdefault(int(pid),self.State())

    def _team(self, team):
        states=[self._get(p) for p in team]
        r=sum(s.rating for s in states)/len(states)
        rd=math.sqrt(sum(s.rd*s.rd for s in states))/len(states)
        return r, max(self.rd_floor, rd)

    def _g(self, rd):
        return 1.0/math.sqrt(1.0+3.0*self.q*self.q*rd*rd/(math.pi*math.pi))

    def predict(self, team_a, team_b):
        ra,rda=self._team(team_a); rb,rdb=self._team(team_b)
        pooled=math.sqrt(rda*rda+rdb*rdb)
        g=self._g(pooled)
        return _clip_prob(1.0/(1.0+10.0**(-g*(ra-rb)/400.0)))

    def update(self, team_a, team_b, team_a_win: bool):
        snap={pid: copy.copy(self._get(pid)) for pid in set(team_a)|set(team_b)}
        def tstats(team):
            ss=[snap[p] for p in team]
            return (sum(s.rating for s in ss)/len(ss),
                    max(self.rd_floor, math.sqrt(sum(s.rd*s.rd for s in ss))/len(ss)))
        ra,rda=tstats(team_a); rb,rdb=tstats(team_b)
        score_a=1.0 if team_a_win else 0.0
        pending={}
        for team, opp_r, opp_rd, score in [
            (team_a,rb,rdb,score_a),(team_b,ra,rda,1.0-score_a)
        ]:
            g=self._g(opp_rd)
            for pid in team:
                s=snap[pid]
                rd=min(350.0, math.sqrt(s.rd*s.rd+self.rd_drift*self.rd_drift))
                e=1.0/(1.0+10.0**(-g*(s.rating-opp_r)/400.0))
                d2=1.0/(self.q*self.q*g*g*max(EPS,e*(1.0-e)))
                inv=1.0/(rd*rd)+1.0/d2
                new_rd=max(self.rd_floor, math.sqrt(1.0/inv))
                new_r=s.rating+(self.q/inv)*g*(score-e)
                pending[pid]=(new_r,new_rd,s.games+1)
        for pid,(r,rd,games) in pending.items():
            s=self._get(pid); s.rating=r; s.rd=rd; s.games=games

    def view(self, player_id: int):
        s=self._get(player_id)
        return RatingView(s.rating,s.rd,s.games)

class TrueSkillTeam(BaseTeamModel):
    """Two-team, no-draw Gaussian skill model in the TrueSkill family.

    This implements a dependency-free two-team v/w moment update. It is not
    branded as Microsoft's reference factor-graph implementation.
    """
    name = "trueskill_family"

    @dataclass
    class State:
        mu: float = 25.0
        sigma: float = 25.0/3.0
        games: int = 0

    def __init__(self, beta: float = 25.0/6.0, tau: float = 25.0/300.0,
                 display_base: float = 1500.0, display_scale: float = 20.0):
        self.beta=float(beta)
        self.tau=float(tau)
        self.display_base=float(display_base)
        self.display_scale=float(display_scale)
        self._s: Dict[int, TrueSkillTeam.State]={}

    def _get(self,pid:int)->State:
        return self._s.setdefault(int(pid),self.State())

    def _snapshot(self, teams):
        snap={}
        for p in teams:
            s=self._get(p)
            sigma=math.sqrt(s.sigma*s.sigma+self.tau*self.tau)
            snap[p]=(s.mu,sigma,s.games)
        return snap

    def predict(self, team_a, team_b):
        ss=[self._get(p) for p in list(team_a)+list(team_b)]
        mu_a=sum(self._get(p).mu for p in team_a)
        mu_b=sum(self._get(p).mu for p in team_b)
        variance=sum(s.sigma*s.sigma+self.beta*self.beta for s in ss)
        c=math.sqrt(max(EPS,variance))
        return _clip_prob(_normal_cdf((mu_a-mu_b)/c))

    def update(self, team_a, team_b, team_a_win: bool):
        allp=list(team_a)+list(team_b)
        snap=self._snapshot(allp)
        mu_a=sum(snap[p][0] for p in team_a)
        mu_b=sum(snap[p][0] for p in team_b)
        variance=sum(snap[p][1]**2+self.beta*self.beta for p in allp)
        c=math.sqrt(max(EPS,variance))
        sign=1.0 if team_a_win else -1.0
        t=sign*(mu_a-mu_b)/c
        denom=max(1e-12,_normal_cdf(t))
        v=_normal_pdf(t)/denom
        w=v*(v+t)
        pending={}
        for pid in team_a:
            mu,sigma,games=snap[pid]
            s2=sigma*sigma
            new_mu=mu+sign*(s2/c)*v
            factor=max(1e-6,1.0-(s2/(c*c))*w)
            pending[pid]=(new_mu,math.sqrt(s2*factor),games+1)
        for pid in team_b:
            mu,sigma,games=snap[pid]
            s2=sigma*sigma
            new_mu=mu-sign*(s2/c)*v
            factor=max(1e-6,1.0-(s2/(c*c))*w)
            pending[pid]=(new_mu,math.sqrt(s2*factor),games+1)
        for pid,(mu,sigma,games) in pending.items():
            s=self._get(pid);s.mu=mu;s.sigma=sigma;s.games=games

    def view(self, player_id: int):
        s=self._get(player_id)
        r=self.display_base+(s.mu-25.0)*self.display_scale
        u=s.sigma*self.display_scale
        return RatingView(r,u,s.games)

def make_model(name: str):
    key=str(name).lower().replace('-','_')
    if key in {'elo','team_elo'}:
        return TeamElo()
    if key in {'glicko','glicko1','team_glicko'}:
        return TeamGlicko()
    if key in {'trueskill','trueskill_family','gaussian'}:
        return TrueSkillTeam()
    raise ValueError(f'unknown model: {name}')
