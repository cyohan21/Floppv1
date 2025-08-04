import {StyleSheet, View} from 'react-native';
import React from 'react';
import {SharedValue, useDerivedValue} from 'react-native-reanimated';
import {Canvas, Path, SkFont, Skia, Text, useFont} from '@shopify/react-native-skia';
import DonutPath from './DonutPath';

type Props = {
  n: number;
  gap: number;
  radius: number;
  strokeWidth: number;
  outerStrokeWidth: number;
  decimals: SharedValue<number[]>;
  colors: string[];
  totalValue: SharedValue<number>;
  font: SkFont;
  formattedTotal: string;
};

const DonutChart = ({
  n,
  gap,
  decimals,
  colors,
  totalValue,
  strokeWidth,
  outerStrokeWidth,
  radius,
  font,
  formattedTotal,
}: Props) => {
  const array = Array.from({length: n});
  const innerRadius = radius - outerStrokeWidth / 2;

  const path = Skia.Path.Make();
  path.addCircle(radius, radius, innerRadius);

  // Remove useDerivedValue for targetText
  // const targetText = useDerivedValue(
  //   () => `$${Math.round(totalValue.value)}`,
  //   [],
  // );

  // Use smaller font for "No Data" text
  const smallFont = useFont(require('./fonts/Roboto-Bold.ttf'), 40);
  const isNoData = formattedTotal === "No Data";
  const displayFont = isNoData && smallFont ? smallFont : font;
  
  const fontSize = displayFont.measureText(isNoData ? 'No Data' : '$00');
  const textX = radius - displayFont.measureText(formattedTotal).width / 2;

  return (
    <View style={styles.container}>
      <Canvas style={styles.container}>
        {array.map((_, index) => {
          return (
            <DonutPath
              key={index}
              radius={radius}
              strokeWidth={strokeWidth}
              outerStrokeWidth={outerStrokeWidth}
              color={colors[index]}
              decimals={decimals}
              index={index}
              gap={gap}
            />
          );
        })}
        <Text
          x={textX}
          y={radius + fontSize.height / 2}
          text={formattedTotal}
          font={displayFont}
          color="black"
        />
      </Canvas>
    </View>
  );
};

export default DonutChart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});