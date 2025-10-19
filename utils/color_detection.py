"""
Banana ripeness detection using color analysis
"""

import cv2
import numpy as np
from PIL import Image
import io
import colorsys

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
    
    if 60 <= hue <= 120:
        return 1  # Green
    elif 45 <= hue < 60:
        return 2  # Light Green
    elif 35 <= hue < 45:
        return 3  # Yellowish
    elif 25 <= hue < 35:
        return 4  # More Yellow
    elif 30 <= hue < 45:
        return 5  # Yellow with Green Tips
    elif 20 <= hue < 30:
        return 6  # Yellow
    elif 0 <= hue < 20:
        return 7  # Yellow with Brown Flecks
    else:
        # Default to stage 3 for any unmapped hues
        return 3


def extract_dominant_color(image_bytes):
    """
    Extract the dominant hue from an image using color analysis.
    
    Args:
        image_bytes (bytes): Image data as bytes
        
    Returns:
        float: Dominant hue value in degrees (0-360)
    """
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to HSV
        hsv_image = image.convert('HSV')
        
        # Get pixel data
        pixels = list(hsv_image.getdata())
        
        # Extract hue values (first channel of HSV)
        hue_values = [pixel[0] for pixel in pixels]
        
        # Calculate dominant hue (most frequent hue)
        hue_counts = {}
        for hue in hue_values:
            # Round to nearest 5 degrees for grouping
            rounded_hue = round(hue / 5) * 5
            hue_counts[rounded_hue] = hue_counts.get(rounded_hue, 0) + 1
        
        # Find the most frequent hue
        dominant_hue = max(hue_counts, key=hue_counts.get)
        
        # Convert from 0-255 range to 0-360 degrees
        return (dominant_hue / 255) * 360
        
    except Exception as e:
        print(f"Error extracting dominant color: {str(e)}")
        return 60.0  # Default to green hue


def hex_to_hue(hex_color):
    """
    Convert hex color to HSV hue value.
    
    Args:
        hex_color (str): Hex color code (e.g., '#FF0000' or 'FF0000')
        
    Returns:
        float: Hue value in degrees (0-360)
    """
    try:
        # Remove '#' if present
        hex_color = hex_color.lstrip('#')
        
        # Convert hex to RGB
        r = int(hex_color[0:2], 16) / 255.0
        g = int(hex_color[2:4], 16) / 255.0
        b = int(hex_color[4:6], 16) / 255.0
        
        # Convert RGB to HSV
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        
        # Convert hue from 0-1 range to 0-360 degrees
        return h * 360
        
    except Exception as e:
        print(f"Error converting hex to hue: {str(e)}")
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
        2: (45, 60),    # Light Green
        3: (35, 45),    # Yellowish
        4: (25, 35),    # More Yellow
        5: (30, 45),    # Yellow with Green Tips
        6: (20, 30),    # Yellow
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