"""
Test suite for color detection functionality in the Go Bananas app.

This module contains tests to validate the core color detection algorithms
including hue-to-stage mapping, days estimation, and color conversion.
"""

import unittest
import sys
import os

# Add the parent directory to the path to import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.color_detection import (
    hue_to_stage,
    estimate_days_until_peak,
    hex_to_hue,
    extract_dominant_color,
    calculate_stage_confidence
)


class TestColorDetection(unittest.TestCase):
    """Test cases for color detection functionality."""

    def test_hue_to_stage_mapping(self):
        """Test that hue_to_stage() returns correct stages for known hue values."""

        # Test known hue values and expected stages based on HUE_RANGES:
        # 1: (60, 120), 2: (50, 60), 3: (40, 50), 4: (30, 40),
        # 5: (25, 30), 6: (20, 25), 7: (0, 20)
        test_cases = [
            (90, 1, "Green banana hue"),
            (55, 2, "Light green hue"),
            (45, 3, "Yellowish hue"),
            (35, 4, "More yellow hue"),
            (27, 5, "Yellow with green tips"),
            (22, 6, "Yellow hue"),
            (10, 7, "Brown flecks hue"),
            (180, 3, "Unmapped hue default"),
        ]

        for hue, expected_stage, description in test_cases:
            with self.subTest(hue=hue, description=description):
                result = hue_to_stage(hue)
                self.assertEqual(result, expected_stage,
                               f"Expected stage {expected_stage} for hue {hue} ({description})")

    def test_hue_to_stage_edge_cases(self):
        """Test hue_to_stage() with edge cases and boundary values."""

        # Test boundary values based on HUE_RANGES:
        # 1: (60, 120), 2: (50, 60), 3: (40, 50), 4: (30, 40),
        # 5: (25, 30), 6: (20, 25), 7: (0, 20)
        boundary_tests = [
            (60, 1, "Lower boundary of stage 1"),
            (120, 1, "Upper boundary of stage 1"),
            (50, 2, "Lower boundary of stage 2"),
            (59, 2, "Inside stage 2"),
            (40, 3, "Lower boundary of stage 3"),
            (49, 3, "Inside stage 3"),
            (30, 4, "Lower boundary of stage 4"),
            (39, 4, "Inside stage 4"),
            (25, 5, "Lower boundary of stage 5"),
            (29, 5, "Inside stage 5"),
            (20, 6, "Lower boundary of stage 6"),
            (24, 6, "Inside stage 6"),
            (0, 7, "Lower boundary of stage 7"),
            (19, 7, "Inside stage 7"),
        ]

        for hue, expected_stage, description in boundary_tests:
            with self.subTest(hue=hue, description=description):
                result = hue_to_stage(hue)
                self.assertEqual(result, expected_stage,
                               f"Boundary test failed for {description}")

    def test_estimate_days_until_peak(self):
        """Test that estimate_days_until_peak() calculates correctly."""

        # Updated for new DURATION_RANGES:
        # 1: (2,4), 2: (1,3), 3: (1,2), 4: (1,2), 5: (1,2), 6: (1,2), 7: (2,5)
        # estimate_days_until_peak sums avg days from current stage to stage 6
        test_cases = [
            (1, 8),   # Stage 1: (2+4)/2 + (1+3)/2 + (1+2)/2 + (1+2)/2 + (1+2)/2 = 3+2+1.5+1.5+1.5 = 9.5 -> round = 10? Let me recalculate
            (6, 0),   # Stage 6: Already at peak
            (7, 0),   # Stage 7: Already past peak
        ]

        # Recalculate stage 1 manually:
        # stage 1 avg: (2+4)/2 = 3.0
        # stage 2 avg: (1+3)/2 = 2.0
        # stage 3 avg: (1+2)/2 = 1.5
        # stage 4 avg: (1+2)/2 = 1.5
        # stage 5 avg: (1+2)/2 = 1.5
        # total = 3.0 + 2.0 + 1.5 + 1.5 + 1.5 = 9.5 -> round = 10

        self.assertEqual(estimate_days_until_peak(1), 10)
        self.assertEqual(estimate_days_until_peak(2), 6)   # 2.0+1.5+1.5+1.5 = 6.5 -> round(6.5)=6 (banker's rounding)
        self.assertEqual(estimate_days_until_peak(6), 0)
        self.assertEqual(estimate_days_until_peak(7), 0)

        # All stages should return non-negative values
        for stage in range(1, 8):
            result = estimate_days_until_peak(stage)
            self.assertGreaterEqual(result, 0, f"Stage {stage} should return non-negative days")

    def test_estimate_days_until_peak_edge_cases(self):
        """Test estimate_days_until_peak() with edge cases."""

        # Test invalid stages - these should raise KeyError or return default
        with self.assertRaises(KeyError):
            estimate_days_until_peak(0)
        with self.assertRaises(KeyError):
            estimate_days_until_peak(-1)
        # Stage 8+ should return 0 (already at peak)
        self.assertEqual(estimate_days_until_peak(8), 0, "Stage 8+ should return 0")

    def test_hex_to_hue_conversion(self):
        """Test that hex_to_hue() converts colors properly."""

        # Test known hex colors and their approximate hue values
        test_cases = [
            ("#00FF00", (110, 130), "Pure green"),
            ("#FF0000", (350, 370), "Pure red"),
            ("#0000FF", (230, 250), "Pure blue"),
            ("#FFFF00", (50, 70), "Pure yellow"),
            ("#FF00FF", (290, 310), "Pure magenta"),
            ("#00FFFF", (170, 190), "Pure cyan"),
            ("#FFFFFF", (0, 360), "White (any hue)"),
            ("#000000", (0, 360), "Black (any hue)"),
        ]

        for hex_color, expected_range, description in test_cases:
            with self.subTest(hex_color=hex_color, description=description):
                result = hex_to_hue(hex_color)

                # Handle wraparound for red (0 = 360)
                if expected_range == (350, 370):
                    self.assertTrue(0 <= result <= 10 or 350 <= result <= 360,
                                  f"Hue {result} should be near 0 or 360 for {description}")
                elif expected_range == (0, 360):
                    self.assertTrue(0 <= result <= 360,
                                  f"Hue {result} should be between 0-360 for {description}")
                else:
                    min_hue, max_hue = expected_range
                    self.assertTrue(min_hue <= result <= max_hue,
                                  f"Hue {result} should be between {min_hue}-{max_hue} for {description}")

    def test_hex_to_hue_with_hash(self):
        """Test hex_to_hue() with and without hash prefix."""

        hex_with_hash = "#FF0000"
        hex_without_hash = "FF0000"

        result_with = hex_to_hue(hex_with_hash)
        result_without = hex_to_hue(hex_without_hash)

        self.assertEqual(result_with, result_without,
                        "Hex colors with and without hash should produce same hue")

    def test_hex_to_hue_invalid_input(self):
        """Test hex_to_hue() with invalid input."""

        invalid_cases = ["GGGGGG", "12345", "ZZZZZZ", "", "12345G"]

        for invalid_hex in invalid_cases:
            with self.subTest(hex_color=invalid_hex):
                with self.assertRaises(ValueError):
                    hex_to_hue(invalid_hex)

    def test_calculate_stage_confidence(self):
        """Test calculate_stage_confidence() returns reasonable confidence values."""

        # calculate_stage_confidence returns percentage (50.0-100.0)
        test_cases = [
            (90, 1, (50.0, 100.0)),
            (55, 2, (50.0, 100.0)),
            (35, 4, (50.0, 100.0)),
            (10, 7, (50.0, 100.0)),
        ]

        for hue, stage, expected_range in test_cases:
            with self.subTest(hue=hue, stage=stage):
                result = calculate_stage_confidence(hue, stage)
                min_conf, max_conf = expected_range
                self.assertTrue(min_conf <= result <= max_conf,
                              f"Confidence {result} should be between {min_conf}-{max_conf} for hue {hue}, stage {stage}")

    def test_calculate_stage_confidence_edge_cases(self):
        """Test calculate_stage_confidence() with edge cases."""

        # Test invalid stage — returns 50.0 (percentage)
        result = calculate_stage_confidence(90, 99)
        self.assertEqual(result, 50.0, "Invalid stage should return default confidence 50.0")

        # Test confidence bounds (percentage scale)
        result = calculate_stage_confidence(90, 1)
        self.assertTrue(50.0 <= result <= 100.0, "Confidence should be between 50.0 and 100.0")

    def test_hue_normalization(self):
        """Test that hue values are properly normalized to 0-360 range."""

        test_cases = [
            (450, 90),
            (-30, 330),
            (720, 0),
            (-720, 0),
        ]

        for input_hue, expected_normalized in test_cases:
            with self.subTest(input_hue=input_hue):
                result = hue_to_stage(input_hue)
                expected_stage = hue_to_stage(expected_normalized)
                self.assertEqual(result, expected_stage,
                               f"Hue {input_hue} should normalize and map to same stage as {expected_normalized}")


class TestColorDetectionIntegration(unittest.TestCase):
    """Integration tests for color detection functionality."""

    def test_full_pipeline_consistency(self):
        """Test that the full color detection pipeline is consistent."""

        test_colors = ["#00FF00", "#FFFF00", "#FFA500", "#8B4513"]

        for hex_color in test_colors:
            with self.subTest(hex_color=hex_color):
                hue = hex_to_hue(hex_color)
                stage = hue_to_stage(hue)
                days = estimate_days_until_peak(stage)
                confidence = calculate_stage_confidence(hue, stage)

                self.assertTrue(0 <= hue <= 360, f"Invalid hue {hue}")
                self.assertTrue(1 <= stage <= 7, f"Invalid stage {stage}")
                self.assertTrue(0 <= days <= 15, f"Invalid days {days}")
                # Confidence is on percentage scale (50.0-100.0)
                self.assertTrue(50.0 <= confidence <= 100.0, f"Invalid confidence {confidence}")


if __name__ == '__main__':
    unittest.main(verbosity=2)
