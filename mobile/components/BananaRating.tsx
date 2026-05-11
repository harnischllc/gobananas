import { View, Text, StyleSheet } from 'react-native';
import {
  Stage,
  ratingFromStage,
  ratingGlyph,
  ratingLabel,
} from '../lib/stages';

/**
 * 5-banana rating, like Yelp stars but bananas. Glyph swaps for stage 7
 * (🙈 — past its prime) and stage 1 (🙉 — not yet). Filled glyphs at full
 * opacity, missing ones faded — proper rating widget, not a count of bananas.
 */
interface Props {
  stage: Stage;
  size?: number;
}

export function BananaRating({ stage, size = 14 }: Props) {
  const rating = ratingFromStage(stage);
  const glyph = ratingGlyph(stage);
  const label = ratingLabel(rating);

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`${rating} out of 5 bananas, ${label}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={[
            styles.glyph,
            { fontSize: size, opacity: i <= rating ? 1 : 0.18 },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {glyph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glyph: {
    // Slight letter-spacing so bananas don't kiss each other.
    marginRight: 1,
  },
});
