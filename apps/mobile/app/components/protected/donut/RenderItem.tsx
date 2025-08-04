import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import React from 'react';
import Animated, {FadeInDown, FadeOutDown} from 'react-native-reanimated';

interface Data {
  value: number;
  percentage: number;
  color: string;
  name: string;
}

type Props = {
  item: Data;
};

function formatAmount(amount: number): string {
  if (amount < 1) return '<$1';
  if (amount < 1000) return `$${Math.floor(amount)}`;
  if (amount < 100000) {
    const k = amount / 1000;
    // Show one decimal if not a round thousand
    return Number.isInteger(k) ? `$${k.toFixed(0)}k` : `$${k.toFixed(1)}k`;
  }
  // 100k and above, round to nearest 50k or 100k
  const rounded = Math.round(amount / 50_000) * 50_000;
  return `$${(rounded / 1000).toFixed(0)}k`;
}

const RenderItem = ({item}: Props) => {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, {backgroundColor: item.color}]} />
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
      <Text style={styles.amount}>{formatAmount(item.value)}</Text>
    </View>
  );
};

export default RenderItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    flex: 1,
    width: '90%'
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    marginLeft: 10,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: 'black',
    fontWeight: '400',
    marginRight: 8,
    minWidth: 0,
  },
  amount: {
    fontSize: 15,
    color: 'black',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 50,
  },
});