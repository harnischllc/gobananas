import { View, Text, StyleSheet } from 'react-native';
import { Stage, STAGES } from '../lib/stages';
import { radius } from '../lib/theme';

export function StageDot({ stage, size = 36 }: { stage: Stage; size?: number }) {
  const def = STAGES[stage];
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: def.colorSoft,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.label, { color: def.color, fontSize: size * 0.38 }]}>
        {stage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
