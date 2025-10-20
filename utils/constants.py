"""Constants for banana ripeness detection"""

# Stage descriptions
STAGE_INFO = {
    1: "Green - Entirely green, firm and starchy. High in resistant starch.",
    2: "Light Green - Breaking toward yellow. Still firm and less sweet.",
    3: "Yellowish - Minimal green. Begins to develop sweetness.",
    4: "More Yellow - Mostly yellow with some green. Starches converting to sugars.",
    5: "Yellow with Green Tips - Ideal for retail. Peak for purchase.",
    6: "Yellow - Peak eating quality. Aromatic and sweet.",
    7: "Yellow with Brown Flecks - Overripe. Best for baking or smoothies."
}

# Duration ranges (min_days, max_days)
DURATION_RANGES = {
    1: (1, 4), 2: (1, 3), 3: (1, 3), 4: (1, 3),
    5: (1, 3), 6: (1, 3), 7: (2, 5)
}

# Hue ranges for each stage (in degrees)
HUE_RANGES = {
    1: (60, 120),   # Green
    2: (50, 60),    # Light Green
    3: (40, 50),    # Yellowish
    4: (30, 40),    # More Yellow
    5: (25, 30),    # Yellow with Green Tips
    6: (20, 25),    # Yellow
    7: (0, 20)      # Brown flecks
}

# Recommendations by stage
RECOMMENDATIONS = {
    1: [
        'Wait 3-4 days for optimal ripeness',
        'Store at room temperature',
        'Perfect for cooking if you prefer less sweet'
    ],
    2: [
        'Wait 2-3 days for better sweetness',
        'Store at room temperature'
    ],
    3: [
        'Wait 1-2 days for peak ripeness',
        'Good for eating now if you prefer less sweet'
    ],
    4: [
        'Wait 1 day for optimal sweetness',
        'Great for smoothies'
    ],
    5: [
        'Perfect for eating',
        'Peak retail stage'
    ],
    6: [
        'Peak eating quality!',
        'Consume within 1-2 days'
    ],
    7: [
        'Best for baking or smoothies',
        'Overripe for fresh eating'
    ]
}
