import React from 'react';
import {Path, Skia} from '@shopify/react-native-skia';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  strokeWidth: number;
  outerStrokeWidth: number;
  gap: number;
  radius: number;
  color: string;
  decimals: SharedValue<number[]>;
  index: number;
};

const DonutPath = ({
  radius,
  gap,
  strokeWidth,
  outerStrokeWidth,
  color,
  decimals,
  index,
}: Props) => {
  const innerRadius = radius - outerStrokeWidth / 2;

  const path = Skia.Path.Make();
  path.addCircle(radius, radius, innerRadius);

  const halfGap = gap / 2;

  const start = useDerivedValue(() => {
    if (index === 0) {
      return halfGap;
    }

    const sum = decimals.value.slice(0, index).reduce((a, b) => a + b, 0);
    return withTiming(sum + halfGap, { duration: 400 });
  }, []);

  const end = useDerivedValue(() => {
    const sum = decimals.value.slice(0, index + 1).reduce((a, b) => a + b, 0);

    if (index === decimals.value.length - 1) {
      return withTiming(1 - halfGap, { duration: 400 });
    }

    return withTiming(sum - halfGap, { duration: 400 });
  }, []);

  return (
    <Path
      path={path}
      color={color}
      style="stroke"
      strokeJoin="round"
      strokeWidth={strokeWidth}
      strokeCap="round"
      start={start}
      end={end}
    />
  );
};

export default DonutPath;