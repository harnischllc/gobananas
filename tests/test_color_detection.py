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
        
        # Test known hue values and expected stages (based on actual implementation)
        test_cases = [
            # (hue, expected_stage, description)
            (90, 1, "Green banana hue"),      # Stage 1: Green (60-120)
            (55, 2, "Light green hue"),      # Stage 2: Light Green (45-60)
            (40, 3, "Yellowish hue"),        # Stage 3: Yellowish (35-45)
            (32, 4, "More yellow hue"),      # Stage 4: More Yellow (25-35)
            (35, 3, "Yellow with green tips"), # Stage 3: Yellowish (35-45) - comes first in if/elif
            (25, 4, "More yellow hue"),      # Stage 4: More Yellow (25-35)
            (22, 6, "Yellow hue"),           # Stage 6: Yellow (20-30)
            (15, 7, "Brown flecks hue"),     # Stage 7: Yellow with Brown Flecks (0-20)
            (180, 3, "Unmapped hue default"), # Default to stage 3
        ]
        
        for hue, expected_stage, description in test_cases:
            with self.subTest(hue=hue, description=description):
                result = hue_to_stage(hue)
                self.assertEqual(result, expected_stage, 
                               f"Expected stage {expected_stage} for hue {hue} ({description})")

    def test_hue_to_stage_edge_cases(self):
        """Test hue_to_stage() with edge cases and boundary values."""
        
        # Test boundary values (based on actual implementation)
        boundary_tests = [
            (60, 1, "Lower boundary of stage 1"),
            (120, 1, "Upper boundary of stage 1"),
            (45, 2, "Lower boundary of stage 2"),
            (59, 2, "Upper boundary of stage 2"),
            (35, 3, "Lower boundary of stage 3"),
            (44, 3, "Upper boundary of stage 3"),
            (25, 4, "Lower boundary of stage 4"),
            (34, 4, "Upper boundary of stage 4"),
            (20, 6, "Lower boundary of stage 6"),
            (29, 4, "Upper boundary of stage 4"),
            (0, 7, "Lower boundary of stage 7"),
            (19, 7, "Upper boundary of stage 7"),
        ]
        
        for hue, expected_stage, description in boundary_tests:
            with self.subTest(hue=hue, description=description):
                result = hue_to_stage(hue)
                self.assertEqual(result, expected_stage, 
                               f"Boundary test failed for {description}")

    def test_estimate_days_until_peak(self):
        """Test that estimate_days_until_peak() calculates correctly."""
        
        # Test cases: (stage, expected_days)
        test_cases = [
            (1, 10),  # Stage 1: (1+4)/2 + (1+3)/2 + (1+3)/2 + (1+3)/2 + (1+3)/2 = 2.5 + 2 + 2 + 2 + 2 = 10.5 ≈ 10
            (2, 8),   # Stage 2: (1+3)/2 + (1+3)/2 + (1+3)/2 + (1+3)/2 = 2 + 2 + 2 + 2 = 8
            (3, 6),   # Stage 3: (1+3)/2 + (1+3)/2 + (1+3)/2 = 2 + 2 + 2 = 6
            (4, 4),   # Stage 4: (1+3)/2 + (1+3)/2 = 2 + 2 = 4
            (5, 2),   # Stage 5: (1+3)/2 = 2
            (6, 0),   # Stage 6: Already at peak
            (7, 0),   # Stage 7: Already past peak
        ]
        
        for stage, expected_days in test_cases:
            with self.subTest(stage=stage):
                result = estimate_days_until_peak(stage)
                self.assertEqual(result, expected_days, 
                               f"Expected {expected_days} days for stage {stage}, got {result}")

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
            # (hex_color, expected_hue_range, description)
            ("#00FF00", (110, 130), "Pure green"),      # Should be around 120°
            ("#FF0000", (350, 370) or (0, 10), "Pure red"),    # Should be around 0° or 360°
            ("#0000FF", (230, 250), "Pure blue"),      # Should be around 240°
            ("#FFFF00", (50, 70), "Pure yellow"),      # Should be around 60°
            ("#FF00FF", (290, 310), "Pure magenta"),   # Should be around 300°
            ("#00FFFF", (170, 190), "Pure cyan"),      # Should be around 180°
            ("#FFFFFF", (0, 360), "White (any hue)"),  # White has no defined hue
            ("#000000", (0, 360), "Black (any hue)"),  # Black has no defined hue
        ]
        
        for hex_color, expected_range, description in test_cases:
            with self.subTest(hex_color=hex_color, description=description):
                result = hex_to_hue(hex_color)
                
                # Handle wraparound for red (0° = 360°)
                if expected_range == (350, 370) or expected_range == (0, 10):
                    self.assertTrue(0 <= result <= 10 or 350 <= result <= 360, 
                                  f"Hue {result} should be near 0° or 360° for {description}")
                elif expected_range == (0, 360):  # For white/black
                    self.assertTrue(0 <= result <= 360, 
                                  f"Hue {result} should be between 0-360° for {description}")
                else:
                    min_hue, max_hue = expected_range
                    self.assertTrue(min_hue <= result <= max_hue, 
                                  f"Hue {result} should be between {min_hue}-{max_hue}° for {description}")

    def test_hex_to_hue_with_hash(self):
        """Test hex_to_hue() with and without hash prefix."""
        
        # Test that both formats work
        hex_with_hash = "#FF0000"
        hex_without_hash = "FF0000"
        
        result_with = hex_to_hue(hex_with_hash)
        result_without = hex_to_hue(hex_without_hash)
        
        self.assertEqual(result_with, result_without, 
                        "Hex colors with and without hash should produce same hue")

    def test_hex_to_hue_invalid_input(self):
        """Test hex_to_hue() with invalid input."""
        
        # Test invalid hex colors - these should raise ValueError
        invalid_cases = ["GGGGGG", "12345", "ZZZZZZ", "", "12345G"]
        
        for invalid_hex in invalid_cases:
            with self.subTest(hex_color=invalid_hex):
                with self.assertRaises(ValueError):
                    hex_to_hue(invalid_hex)

    def test_calculate_stage_confidence(self):
        """Test calculate_stage_confidence() returns reasonable confidence values."""
        
        # Test cases: (hue, stage, expected_confidence_range)
        test_cases = [
            (90, 1, (0.6, 1.0)),    # Hue in center of stage 1 range should have high confidence
            (50, 2, (0.6, 1.0)),    # Hue in center of stage 2 range should have high confidence
            (30, 4, (0.6, 1.0)),    # Hue in center of stage 4 range should have high confidence
            (10, 7, (0.6, 1.0)),    # Hue in center of stage 7 range should have high confidence
        ]
        
        for hue, stage, expected_range in test_cases:
            with self.subTest(hue=hue, stage=stage):
                result = calculate_stage_confidence(hue, stage)
                min_conf, max_conf = expected_range
                self.assertTrue(min_conf <= result <= max_conf, 
                              f"Confidence {result} should be between {min_conf}-{max_conf} for hue {hue}, stage {stage}")

    def test_calculate_stage_confidence_edge_cases(self):
        """Test calculate_stage_confidence() with edge cases."""
        
        # Test invalid stage
        result = calculate_stage_confidence(90, 99)
        self.assertEqual(result, 0.5, "Invalid stage should return default confidence 0.5")
        
        # Test confidence bounds
        result = calculate_stage_confidence(90, 1)
        self.assertTrue(0.3 <= result <= 1.0, "Confidence should be between 0.3 and 1.0")

    def test_hue_normalization(self):
        """Test that hue values are properly normalized to 0-360 range."""
        
        # Test hue values outside normal range
        test_cases = [
            (450, 90),    # 450° should normalize to 90°
            (-30, 330),   # -30° should normalize to 330°
            (720, 0),     # 720° should normalize to 0°
            (-720, 0),    # -720° should normalize to 0°
        ]
        
        for input_hue, expected_normalized in test_cases:
            with self.subTest(input_hue=input_hue):
                result = hue_to_stage(input_hue)
                # The result should be consistent with the normalized hue
                expected_stage = hue_to_stage(expected_normalized)
                self.assertEqual(result, expected_stage, 
                               f"Hue {input_hue} should normalize and map to same stage as {expected_normalized}")


class TestColorDetectionIntegration(unittest.TestCase):
    """Integration tests for color detection functionality."""

    def test_full_pipeline_consistency(self):
        """Test that the full color detection pipeline is consistent."""
        
        # Test that hex -> hue -> stage -> days estimation is consistent
        test_colors = ["#00FF00", "#FFFF00", "#FFA500", "#8B4513"]
        
        for hex_color in test_colors:
            with self.subTest(hex_color=hex_color):
                # Convert hex to hue
                hue = hex_to_hue(hex_color)
                
                # Convert hue to stage
                stage = hue_to_stage(hue)
                
                # Estimate days until peak
                days = estimate_days_until_peak(stage)
                
                # Calculate confidence
                confidence = calculate_stage_confidence(hue, stage)
                
                # All results should be valid
                self.assertTrue(0 <= hue <= 360, f"Invalid hue {hue}")
                self.assertTrue(1 <= stage <= 7, f"Invalid stage {stage}")
                self.assertTrue(0 <= days <= 15, f"Invalid days {days}")
                self.assertTrue(0.3 <= confidence <= 1.0, f"Invalid confidence {confidence}")


if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)
