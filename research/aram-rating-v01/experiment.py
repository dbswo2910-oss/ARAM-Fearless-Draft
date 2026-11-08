from __future__ import annotations


def _comparison(report: dict, a: str, b: str):
    for row in report.get('comparisons') or []:
        if row.get('a')==a and row.get('b')==b:
            return row.get('a_minus_b')
        if row.get('a')==b and row.get('b')==a:
            x=row.get('a_minus_b')
            if not x:return None
            lo,hi=x['ci95']
            return {'mean_delta':-x['mean_delta'],'ci95':[-hi,-lo]}
    return None


def candidate_decision(report: dict, baseline_model: str, candidate_model: str,
                       min_test_matches: int=100) -> dict:
    """Gate a new hypothesis using only the frozen future-test result."""
    models=report.get('models') or {}
    if baseline_model not in models or candidate_model not in models:
        raise KeyError('baseline/candidate model missing from report')
    base=models[baseline_model]['frozen'];cand=models[candidate_model]['frozen']
    same_test=base.get('n')==cand.get('n')==report.get('dataset',{}).get('test')
    enough=int(cand.get('n') or 0)>=int(min_test_matches)
    delta=_comparison(report,candidate_model,baseline_model)
    ci=delta.get('ci95') if delta else None
    improved=(cand.get('log_loss') is not None and base.get('log_loss') is not None and
              cand['log_loss'] < base['log_loss'])
    significant=bool(ci and ci[1] < 0)
    promote=bool(same_test and enough and improved and significant)
    return {
        'baseline':baseline_model,'candidate':candidate_model,
        'test_matches':cand.get('n'),'same_future_test':same_test,
        'minimum_test_matches':int(min_test_matches),'enough_test_matches':enough,
        'baseline_log_loss':base.get('log_loss'),'candidate_log_loss':cand.get('log_loss'),
        'candidate_minus_baseline_bootstrap':delta,
        'future_test_improved':improved,'statistically_clear':significant,
        'decision':'promote_candidate' if promote else 'reject_or_keep_experimental',
        'rule':'future frozen test only; training fit is never a promotion criterion'
    }
