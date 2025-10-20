"""
Banana ripeness detection using color analysis

This module provides comprehensive banana ripeness detection functionality
using computer vision and color analysis techniques based on the USDA
banana color scale.
"""

import cv2
import numpy as np
from PIL import Image
import io
import colorsys
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Duration ranges for each stage (min_days, max_days)
DURATION_RANGES = {
    1: (1, 4),   # Stage 1: Green
    2: (1, 3),   # Stage 2: Light Green
    3: (1, 3),   # Stage 3: Yellowish
    4: (1, 3),   # Stage 4: More Yellow
    5: (1, 3),   # Stage 5: Yellow with Green Tips
    6: (1, 3),   # Stage 6: Yellow
    7: (2, 5)    # Stage 7: Yellow with Brown Flecks
}

# Stage descriptions for banana ripeness
STAGE_INFO = {
    1: "Green - Entirely green, firm and starchy. High in resistant starch.",
    2: "Light Green - Breaking toward yellow. Still firm and less sweet.",
    3: "Yellowish - Minimal green. Begins to develop sweetness.",
    4: "More Yellow - Mostly yellow with some green. Starches converting to sugars.",
    5: "Yellow with Green Tips - Ideal for retail. Peak for purchase.",
    6: "Yellow - Peak eating quality. Aromatic and sweet.",
    7: "Yellow with Brown Flecks - Overripe. Best for baking or smoothies."
}


def estimate_days_until_peak(stage):
    """
    Estimate the number of days until the banana reaches peak ripeness (stage 6).
    
    Args:
        stage (int): Current banana ripeness stage (1-7)
        
    Returns:
        int: Estimated days until peak ripeness, rounded to nearest integer
    """
    if stage >= 6:
        return 0
    
    total_days = 0
    for current_stage in range(stage, 6):
        min_days, max_days = DURATION_RANGES[current_stage]
        avg_days = (min_days + max_days) / 2
        total_days += avg_days
    
    return round(total_days)


def hue_to_stage(hue):
    """
    Map hue value to banana ripeness stage.
    
    Args:
        hue (float): Hue value in degrees (0-360)
        
    Returns:
        int: Banana ripeness stage (1-7)
    """
    # Normalize hue to 0-360 range
    hue = hue % 360
    
    # Define mutually exclusive ranges ordered from green to brown
    if 60 <= hue <= 120:
        return 1  # Green
    elif 50 <= hue < 60:
        return 2  # Light Green
    elif 40 <= hue < 50:
        return 3  # Yellowish
    elif 30 <= hue < 40:
        return 4  # More Yellow
    elif 25 <= hue < 30:
        return 5  # Yellow with Green Tips
    elif 20 <= hue < 25:
        return 6  # Yellow
    elif 0 <= hue < 20:
        return 7  # Yellow with Brown Flecks
    else:
        # Default to stage 3 for any unmapped hues
        return 3


def extract_dominant_color(image_bytes):
    """
    Extract the dominant hue from an image using color analysis.
    
    This function processes an image to identify the most prominent color
    and returns its hue value in degrees. It uses HSV color space for
    more accurate color analysis.
    
    Args:
        image_bytes (bytes): Image data as bytes
        
    Returns:
        float: Dominant hue value in degrees (0-360)
        
    Raises:
        ValueError: If image_bytes is invalid or empty
        Exception: For other image processing errors
    """
    try:
        logger.debug(f"Processing image with {len(image_bytes)} bytes")
        
        # Validate input
        if not image_bytes or len(image_bytes) == 0:
            logger.error("Empty image data provided")
            raise ValueError("Empty image data provided")
        
        # Open image from bytes
        try:
            image = Image.open(io.BytesIO(image_bytes))
            logger.debug(f"Successfully opened image: {image.size}, mode: {image.mode}")
        except Exception as e:
            logger.error(f"Failed to open image: {str(e)}")
            raise ValueError(f"Invalid image format: {str(e)}")
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            logger.debug(f"Converting image from {image.mode} to RGB")
            image = image.convert('RGB')
        
        # Convert to HSV
        try:
            hsv_image = image.convert('HSV')
            logger.debug("Successfully converted image to HSV color space")
        except Exception as e:
            logger.error(f"Failed to convert image to HSV: {str(e)}")
            raise ValueError(f"Color space conversion failed: {str(e)}")
        
        # Get pixel data
        pixels = list(hsv_image.getdata())
        logger.debug(f"Extracted {len(pixels)} pixels for analysis")
        
        if not pixels:
            logger.error("No pixels found in image")
            raise ValueError("No pixel data found in image")
        
        # Extract hue values (first channel of HSV)
        hue_values = [pixel[0] for pixel in pixels if len(pixel) >= 3]
        
        if not hue_values:
            logger.error("No valid hue values found")
            raise ValueError("No valid color data found in image")
        
        # Calculate dominant hue (most frequent hue)
        hue_counts = {}
        for hue in hue_values:
            # Round to nearest 5 degrees for grouping
            rounded_hue = round(hue / 5) * 5
            hue_counts[rounded_hue] = hue_counts.get(rounded_hue, 0) + 1
        
        if not hue_counts:
            logger.error("No hue counts generated")
            raise ValueError("Failed to analyze image colors")
        
        # Find the most frequent hue
        dominant_hue = max(hue_counts, key=hue_counts.get)
        
        # Convert from 0-255 range to 0-360 degrees
        result_hue = (dominant_hue / 255) * 360
        
        logger.info(f"Extracted dominant hue: {result_hue:.2f}° from {len(hue_values)} pixels")
        return result_hue
        
    except ValueError as e:
        logger.error(f"Validation error in extract_dominant_color: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in extract_dominant_color: {str(e)}", exc_info=True)
        return 60.0  # Default to green hue


def hex_to_hue(hex_color):
    """
    Convert hex color to HSV hue value.
    
    This function takes a hexadecimal color code and converts it to
    the corresponding hue value in degrees using HSV color space.
    
    Args:
        hex_color (str): Hex color code (e.g., '#FF0000' or 'FF0000')
        
    Returns:
        float: Hue value in degrees (0-360)
        
    Raises:
        ValueError: If hex_color is invalid or malformed
        Exception: For other conversion errors
    """
    try:
        logger.debug(f"Converting hex color: {hex_color}")
        
        # Validate input
        if not isinstance(hex_color, str):
            logger.error(f"Invalid input type for hex_color: {type(hex_color)}")
            raise ValueError("Hex color must be a string")
        
        if not hex_color:
            logger.error("Empty hex color provided")
            raise ValueError("Empty hex color provided")
        
        # Remove '#' if present
        hex_color = hex_color.lstrip('#')
        
        # Validate hex color format
        if len(hex_color) not in [3, 6]:
            logger.error(f"Invalid hex color length: {len(hex_color)}")
            raise ValueError(f"Hex color must be 3 or 6 characters long, got {len(hex_color)}")
        
        # Expand 3-character hex to 6-character
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
            logger.debug(f"Expanded 3-char hex to 6-char: {hex_color}")
        
        # Validate hex characters
        if not all(c in '0123456789ABCDEFabcdef' for c in hex_color):
            logger.error(f"Invalid hex characters in: {hex_color}")
            raise ValueError("Hex color contains invalid characters")
        
        # Convert hex to RGB
        try:
            r = int(hex_color[0:2], 16) / 255.0
            g = int(hex_color[2:4], 16) / 255.0
            b = int(hex_color[4:6], 16) / 255.0
            logger.debug(f"RGB values: R={r:.3f}, G={g:.3f}, B={b:.3f}")
        except ValueError as e:
            logger.error(f"Failed to parse hex color: {str(e)}")
            raise ValueError(f"Invalid hex color format: {str(e)}")
        
        # Validate RGB values
        if not all(0 <= val <= 1 for val in [r, g, b]):
            logger.error(f"Invalid RGB values: R={r}, G={g}, B={b}")
            raise ValueError("RGB values must be between 0 and 1")
        
        # Convert RGB to HSV
        try:
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            logger.debug(f"HSV values: H={h:.3f}, S={s:.3f}, V={v:.3f}")
        except Exception as e:
            logger.error(f"Failed to convert RGB to HSV: {str(e)}")
            raise ValueError(f"Color space conversion failed: {str(e)}")
        
        # Convert hue from 0-1 range to 0-360 degrees
        result_hue = h * 360
        
        logger.info(f"Converted hex {hex_color} to hue: {result_hue:.2f}°")
        return result_hue
        
    except ValueError as e:
        logger.error(f"Validation error in hex_to_hue: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in hex_to_hue: {str(e)}", exc_info=True)
        return 60.0  # Default to green hue


def detect_banana_ripeness(image_file):
    """
    Analyze banana image and determine ripeness level based on color patterns.
    
    Args:
        image_file: Flask file object containing the banana image
        
    Returns:
        dict: Ripeness analysis results with stage-based information
    """
    try:
        # Read image from file
        image_data = image_file.read()
        image_file.seek(0)  # Reset file pointer
        
        # Extract dominant hue from image
        dominant_hue = extract_dominant_color(image_data)
        
        # Map hue to ripeness stage
        stage = hue_to_stage(dominant_hue)
        
        # Get stage information
        stage_description = STAGE_INFO.get(stage, "Unknown stage")
        
        # Calculate days until peak
        days_until_peak = estimate_days_until_peak(stage)
        
        # Generate recommendations based on stage
        recommendations = get_stage_recommendations(stage)
        
        # Calculate confidence based on hue consistency
        confidence = calculate_stage_confidence(dominant_hue, stage)
        
        return {
            'stage': stage,
            'level': f"Stage {stage}",
            'description': stage_description,
            'dominant_hue': dominant_hue,
            'days_until_peak': days_until_peak,
            'confidence': confidence,
            'recommendations': recommendations
        }
        
    except Exception as e:
        print(f"Error in ripeness detection: {str(e)}")
        return {
            'stage': 0,
            'level': 'Unknown',
            'description': 'Unable to analyze the image',
            'dominant_hue': 0.0,
            'days_until_peak': 0,
            'confidence': 0.0,
            'recommendations': ['Please try with a clearer image'],
            'error': str(e)
        }


def get_stage_recommendations(stage):
    """
    Get recommendations based on banana ripeness stage.
    
    Args:
        stage (int): Banana ripeness stage (1-7)
        
    Returns:
        list: List of recommendations for the current stage
    """
    recommendations = {
        1: [
            'Wait 3-4 days for optimal ripeness',
            'Store at room temperature',
            'Avoid refrigeration at this stage',
            'Perfect for cooking if you prefer less sweet bananas'
        ],
        2: [
            'Wait 2-3 days for better sweetness',
            'Store at room temperature',
            'Good for cooking or eating if you prefer less sweet'
        ],
        3: [
            'Wait 1-2 days for peak ripeness',
            'Good for eating now if you prefer less sweet',
            'Perfect for cooking'
        ],
        4: [
            'Wait 1 day for optimal sweetness',
            'Good for eating now',
            'Great for smoothies'
        ],
        5: [
            'Perfect for purchase and eating',
            'Peak retail stage',
            'Good for 1-2 days'
        ],
        6: [
            'Peak eating quality!',
            'Best for fresh consumption',
            'Use within 1-2 days',
            'Perfect for smoothies'
        ],
        7: [
            'Excellent for baking banana bread',
            'Perfect for smoothies and shakes',
            'Great for natural sweetener in baking',
            'Freeze for future use'
        ]
    }
    
    return recommendations.get(stage, ['Unable to provide recommendations'])


def calculate_stage_confidence(hue, stage):
    """
    Calculate confidence level based on how well the hue matches the expected stage range.
    
    Args:
        hue (float): Dominant hue value
        stage (int): Determined stage
        
    Returns:
        float: Confidence value between 0.0 and 1.0
    """
    # Define hue ranges for each stage
    stage_hue_ranges = {
        1: (60, 120),   # Green
        2: (50, 60),    # Light Green
        3: (40, 50),    # Yellowish
        4: (30, 40),    # More Yellow
        5: (25, 30),    # Yellow with Green Tips
        6: (20, 25),    # Yellow
        7: (0, 20)      # Brown flecks
    }
    
    if stage not in stage_hue_ranges:
        return 0.5  # Default confidence
    
    min_hue, max_hue = stage_hue_ranges[stage]
    
    # Calculate how close the hue is to the center of the range
    center_hue = (min_hue + max_hue) / 2
    range_width = max_hue - min_hue
    
    # Distance from center as percentage of range width
    distance_from_center = abs(hue - center_hue)
    confidence = max(0.3, 1.0 - (distance_from_center / (range_width / 2)))
    
    return min(1.0, confidence)