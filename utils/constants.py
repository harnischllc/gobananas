"""Constants for banana ripeness detection — enriched with USDA data."""

STAGE_INFO = {
    1: "Green — Firm, starchy, not sweet. High in resistant starch (~70-80%), acts as a prebiotic. Best for cooking (like plantains) or if you prefer less sweetness.",
    2: "Light Green — Breaking color. Still firm with mild flavor. Starch beginning to convert to sugars (~60% starch). Good for stir-fry or grilling.",
    3: "Yellowish — Minimal green remaining. Developing sweetness (~40% starch). Balanced flavor, good for eating fresh if you like firmer texture.",
    4: "More Yellow — Mostly yellow, traces of green. Sugars rising (~20% starch). Sweet-tart balance. Great for smoothies and cereal.",
    5: "Yellow with Green Tips — Ideal retail stage. Peak for purchase. Sweet with slight firmness (~10% starch). Best all-around eating banana.",
    6: "Yellow — Full ripe. Peak eating quality. Aromatic, sweet, soft (~1-2% starch). Highest antioxidant content. Eat within 1-2 days.",
    7: "Yellow with Brown Flecks — Overripe for fresh eating. Maximum sugar content. Highest in antioxidants (TNF production up 8x vs green). Perfect for baking, smoothies, baby food, or freezing."
}

DURATION_RANGES = {
    1: (2, 4), 2: (1, 3), 3: (1, 2), 4: (1, 2),
    5: (1, 2), 6: (1, 2), 7: (2, 5)
}

HUE_RANGES = {
    1: (60, 120),
    2: (50, 60),
    3: (40, 50),
    4: (30, 40),
    5: (25, 30),
    6: (20, 25),
    7: (0, 20)
}

RECOMMENDATIONS = {
    1: [
        'Store at room temperature (65-75F) to ripen naturally',
        'To speed up: place in a paper bag with an apple or ripe banana',
        'Great for cooking — treat like a plantain',
        'Expected time to peak ripeness: 4-7 days'
    ],
    2: [
        'Keep at room temperature — progressing well',
        'To speed up: paper bag method (adds 1-2 days)',
        'Expected time to peak: 3-5 days'
    ],
    3: [
        'Almost there — 2-3 days to peak sweetness',
        'Good for eating now if you prefer firmer texture',
        'To slow down: move to refrigerator (peel darkens but flesh stays)'
    ],
    4: [
        'Very close to peak — 1-2 days',
        'Great for smoothies and snacking right now',
        'Separate from other fruit to slow ripening (ethylene gas)'
    ],
    5: [
        'Excellent eating quality right now',
        'Peak for purchase — will be perfect in 1 day',
        'Refrigerate to hold at this stage for 2-3 extra days'
    ],
    6: [
        'Peak eating quality — enjoy today!',
        'Refrigerate immediately to preserve for 1-2 more days',
        'Highest antioxidant level of all fresh-eating stages'
    ],
    7: [
        'Past peak for fresh eating — but ideal for:',
        'Banana bread, muffins, pancakes',
        'Smoothies (freeze peeled chunks for later)',
        'Baby food (naturally sweet, easy to mash)',
        'Freeze now: peel, break into chunks, freeze in bags for up to 3 months'
    ]
}

STORAGE_TIPS = {
    'slow_ripening': [
        'Refrigerate: peel darkens but flesh stays fresh 4-5 extra days',
        'Separate bananas from the bunch — they ripen slower apart',
        'Keep away from other fruit (apples, avocados emit ethylene)',
        'Wrap stems in plastic wrap to slow ethylene release'
    ],
    'speed_ripening': [
        'Paper bag with an apple or ripe banana (traps ethylene gas)',
        'Warm spot (75-85F) accelerates ripening by 1-2 days',
        'Keep bunch together — mutual ethylene speeds things up',
        'Oven method: 300F for 15-20 min (for baking only, changes texture)'
    ],
    'preserve': [
        'Freeze peeled chunks — good for 3 months',
        'Mash and freeze in portions for baking',
        'Dehydrate into banana chips',
        'Blend into smoothie packs with other frozen fruit'
    ]
}

NUTRITION = {
    1: {'starch_pct': 80, 'sugar_pct': 1, 'resistant_starch': 'Very high', 'antioxidants': 'Low', 'gi_index': 'Low (~30)'},
    2: {'starch_pct': 65, 'sugar_pct': 6, 'resistant_starch': 'High', 'antioxidants': 'Low', 'gi_index': 'Low-Medium (~40)'},
    3: {'starch_pct': 40, 'sugar_pct': 14, 'resistant_starch': 'Moderate', 'antioxidants': 'Moderate', 'gi_index': 'Medium (~48)'},
    4: {'starch_pct': 20, 'sugar_pct': 18, 'resistant_starch': 'Low', 'antioxidants': 'Moderate', 'gi_index': 'Medium (~52)'},
    5: {'starch_pct': 10, 'sugar_pct': 20, 'resistant_starch': 'Very low', 'antioxidants': 'High', 'gi_index': 'Medium-High (~55)'},
    6: {'starch_pct': 2, 'sugar_pct': 23, 'resistant_starch': 'Minimal', 'antioxidants': 'Very high', 'gi_index': 'High (~60)'},
    7: {'starch_pct': 1, 'sugar_pct': 25, 'resistant_starch': 'None', 'antioxidants': 'Highest', 'gi_index': 'High (~62)'}
}
