import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 320;
const PADDING = 50;

interface WeeklyData {
  week: string;
  previousMonth: number;
  currentMonth: number;
}

interface ComparisonChartProps {
  data: WeeklyData[];
  previousMonthName: string;
  currentMonthName: string;
}

export default function ComparisonChart({ data, previousMonthName, currentMonthName }: ComparisonChartProps) {
  // Calculate max value for Y-axis scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.previousMonth, d.currentMonth)),
    100 // Minimum scale
  );
  
  // Round up to nearest 100 for cleaner Y-axis
  const yAxisMax = Math.ceil(maxValue / 100) * 100;
  
  // Calculate chart dimensions
  const chartInnerWidth = CHART_WIDTH - (PADDING * 2);
  const chartInnerHeight = CHART_HEIGHT - (PADDING * 2);
  
  // Calculate point positions
  const xStep = chartInnerWidth / (data.length - 1);
  
  const getYPosition = (value: number) => {
    return PADDING + chartInnerHeight - (value / yAxisMax) * chartInnerHeight;
  };
  
  const getXPosition = (index: number) => {
    return PADDING + index * xStep;
  };

  // Generate Y-axis labels (5 steps)
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
    return (yAxisMax / yAxisSteps) * i;
  });

  const formatAmount = (amount: number): string => {
    if (amount < 1000) return `$${Math.floor(amount)}`;
    return `$${(amount / 1000).toFixed(0)}k`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#9CA3AF' }]} />
          <Text style={styles.legendText}>{previousMonthName}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#6a12e4' }]} />
          <Text style={styles.legendText}>{currentMonthName}</Text>
        </View>
      </View>
      
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart}>
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map((value, index) => {
          const y = getYPosition(value);
          return (
            <G key={`y-${index}`}>
              <Line
                x1={PADDING}
                y1={y}
                x2={CHART_WIDTH - PADDING}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
              <SvgText
                x={PADDING - 10}
                y={y + 5}
                fontSize="12"
                fill="#666"
                textAnchor="end"
              >
                {formatAmount(value)}
              </SvgText>
            </G>
          );
        })}
        
        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = getXPosition(index);
          return (
            <SvgText
              key={`x-${index}`}
              x={x}
              y={CHART_HEIGHT - 10}
              fontSize="11"
              fill="#666"
              textAnchor="middle"
            >
              {item.week}
            </SvgText>
          );
        })}
        
        {/* Previous month line */}
        {data.map((item, index) => {
          if (index === 0) return null;
          const prevPoint = data[index - 1];
          const x1 = getXPosition(index - 1);
          const y1 = getYPosition(prevPoint.previousMonth);
          const x2 = getXPosition(index);
          const y2 = getYPosition(item.previousMonth);
          
          return (
            <Line
              key={`prev-line-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#9CA3AF"
              strokeWidth="3"
            />
          );
        })}
        
        {/* Current month line */}
        {data.map((item, index) => {
          if (index === 0) return null;
          const prevPoint = data[index - 1];
          const x1 = getXPosition(index - 1);
          const y1 = getYPosition(prevPoint.currentMonth);
          const x2 = getXPosition(index);
          const y2 = getYPosition(item.currentMonth);
          
          return (
            <Line
              key={`curr-line-${index}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#6a12e4"
              strokeWidth="3"
            />
          );
        })}
        
        {/* Previous month points */}
        {data.map((item, index) => {
          const x = getXPosition(index);
          const y = getYPosition(item.previousMonth);
          
          return (
            <Circle
              key={`prev-point-${index}`}
              cx={x}
              cy={y}
              r="5"
              fill="#9CA3AF"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Current month points */}
        {data.map((item, index) => {
          const x = getXPosition(index);
          const y = getYPosition(item.currentMonth);
          
          return (
            <Circle
              key={`curr-point-${index}`}
              cx={x}
              cy={y}
              r="5"
              fill="#6a12e4"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chart: {
    backgroundColor: 'white',
  },
}); 