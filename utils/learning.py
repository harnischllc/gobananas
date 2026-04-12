"""Learning system for improving ripeness predictions from user feedback."""

from utils.constants import HUE_RANGES

def compute_adjusted_boundaries(corrections):
    """Adjust hue-to-stage boundaries based on aggregate user corrections."""
    boundaries = dict(HUE_RANGES)

    if len(corrections) < 10:
        return boundaries

    stage_hues = {}
    for c in corrections:
        stage = c['corrected_stage']
        if stage not in stage_hues:
            stage_hues[stage] = []
        stage_hues[stage].append(c['hue'])

    for stage, hues in stage_hues.items():
        if len(hues) < 5:
            continue
        observed_min = min(hues)
        observed_max = max(hues)
        current_min, current_max = boundaries.get(stage, (0, 360))
        new_min = current_min * 0.7 + observed_min * 0.3
        new_max = current_max * 0.7 + observed_max * 0.3
        boundaries[stage] = (round(new_min, 1), round(new_max, 1))

    return boundaries


def compute_user_preference(feedbacks):
    """Determine a user's preferred ripeness stage from their feedback history."""
    if len(feedbacks) < 2:
        return None

    stage_scores = {}
    for f in feedbacks:
        stage = f['stage']
        if stage not in stage_scores:
            stage_scores[stage] = 0
        if f['feedback'] == 'up':
            stage_scores[stage] += 1
        else:
            stage_scores[stage] -= 1

    if not stage_scores:
        return None

    return max(stage_scores, key=stage_scores.get)
