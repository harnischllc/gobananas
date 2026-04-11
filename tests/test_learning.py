import pytest
from utils.learning import compute_adjusted_boundaries, compute_user_preference

def test_no_corrections_returns_default_boundaries():
    corrections = []
    boundaries = compute_adjusted_boundaries(corrections)
    assert boundaries[1] == (60, 120)  # stage 1 default

def test_corrections_shift_boundary():
    corrections = [{'hue': 55, 'corrected_stage': 1}] * 20
    boundaries = compute_adjusted_boundaries(corrections)
    assert boundaries[1][0] < 60  # lower bound shifted down

def test_user_preference_no_data():
    result = compute_user_preference([])
    assert result is None

def test_user_preference_with_feedback():
    feedbacks = [
        {'stage': 5, 'feedback': 'up'},
        {'stage': 5, 'feedback': 'up'},
        {'stage': 6, 'feedback': 'down'},
    ]
    result = compute_user_preference(feedbacks)
    assert result == 5
