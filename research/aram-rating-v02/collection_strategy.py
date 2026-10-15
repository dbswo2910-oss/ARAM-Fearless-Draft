from __future__ import annotations


def recommend_phase_b(network: dict, cold_start_rate: float | None = None) -> dict:
    players = int(network.get('players') or 0)
    single = float((network.get('single_match_players') or {}).get('fraction') or 0.0)
    largest = float(network.get('largest_component_fraction') or 0.0)
    avg = float(network.get('avg_matches_per_player') or 0.0)
    ten_plus = float((network.get('ten_plus_match_players') or {}).get('fraction') or 0.0)
    cold = None if cold_start_rate is None else float(cold_start_rate)

    if players == 0:
        case = 'NO_DATA'
        recommendation = '먼저 로컬 앱에서 실제 queue 450 전적을 export해 Phase A 표본을 만든다.'
        reason = 'player network가 아직 존재하지 않음.'
    elif largest < 0.70:
        case = 'CASE_C_COMPONENT_BRIDGING'
        recommendation = '새 랜덤 seed를 늘리기보다 기존 component 사이를 연결할 수 있는 관측 플레이어의 history 확장을 우선한다.'
        reason = f'largest component가 {largest*100:.1f}%로 작아 네트워크가 분절되어 있음.'
    elif single >= 0.65 or (cold is not None and cold >= 0.50):
        case = 'CASE_B_REPEAT_EXISTING_PLAYERS'
        recommendation = '새 seed 추가보다 이미 등장한 참가자들의 history를 더 확보해 반복 관측 수를 늘린다.'
        reason = f'single-match player 비율 {single*100:.1f}% / cold-start {cold*100:.1f}%' if cold is not None else f'single-match player 비율 {single*100:.1f}%.'
    elif avg >= 2.5 or ten_plus >= 0.08:
        case = 'CASE_A_DEEPEN_CURRENT_COMPONENT'
        recommendation = '현재 연결 component의 기존 유저 주변 전적을 더 깊게 확보하는 방식이 가장 효율적이다.'
        reason = f'평균 {avg:.2f}경기/player, 10+경기 player {ten_plus*100:.1f}%로 반복 관측 기반이 형성됨.'
    else:
        case = 'CASE_HYBRID'
        recommendation = '현재 component를 유지하면서 2~5경기 관측 플레이어를 우선 확장하고, 이후 연결성이 부족한 구간만 보강한다.'
        reason = f'largest component {largest*100:.1f}%, single-match {single*100:.1f}%, 평균 {avg:.2f}경기/player로 한 전략이 압도적이지 않음.'

    return {
        'case': case,
        'recommendation': recommendation,
        'reason': reason,
        'inputs': {
            'players': players,
            'largest_component_fraction': largest,
            'single_match_fraction': single,
            'avg_matches_per_player': avg,
            'ten_plus_fraction': ten_plus,
            'cold_start_rate': cold,
        },
        'riot_match_v5_auto_expansion': False,
    }
