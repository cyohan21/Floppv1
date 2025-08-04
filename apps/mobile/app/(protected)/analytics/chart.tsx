/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect} from 'react';
import {ScrollView, StyleSheet, Text, View, TouchableOpacity, FlatList, Dimensions} from 'react-native';
import {MONTHS, DUMMY_DATA, Data as CategoryData} from '../../components/protected/donut/dummyData';
import DonutChart from '../../components/protected/donut/DonutChart';
import ComparisonChart from '../../components/protected/settings/comparisonChart';
import {useFont} from '@shopify/react-native-skia';
import {useSharedValue, withTiming} from 'react-native-reanimated';
import RenderItem from '../../components/protected/donut/RenderItem';
import {SafeAreaView} from 'react-native-safe-area-context';
import { PageBlocker } from '../../components/protected/PageBlocker';
import { useBankStatus } from '../../contexts/bankStatusContext';
import { useRouter } from 'expo-router';
import { plaidService } from '../../services/plaidService';
import { useFocusEffect } from '@react-navigation/native';

const RADIUS = 140;
const STROKE_WIDTH = 38;
const OUTER_STROKE_WIDTH = 34;
const GAP = 0.053;
const FALLBACK_COLORS = ['#fe769c', '#46a0f8', '#c3f439', '#88dabc', '#ef4444', '#ff9800', '#8e24aa', '#00acc1'];

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const ITEM_WIDTH = 130;
const SIDE_PAD = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// Function to generate weekly data from monthly category data
const generateWeeklyData = (currentMonthData: CategoryData[], previousMonthData: CategoryData[], monthName: string) => {
  const currentTotal = currentMonthData.reduce((acc, item) => acc + item.value, 0);
  const previousTotal = previousMonthData.reduce((acc, item) => acc + item.value, 0);
  
  // Generate 5 weeks with more varied spending patterns for noticeable differences
  // More dramatic week-to-week changes to make differences clear
  const currentWeeklyPercentages = [0, 0.08, 0.35, 0.65, 1.0]; // Current month pattern
  const previousWeeklyPercentages = [0, 0.18, 0.25, 0.80, 1.0]; // Previous month pattern (different curve)
  
  const monthAbbr = monthName.slice(0, 3);
  const weekDates = [1, 8, 15, 22, 29];
  
  return currentWeeklyPercentages.map((percentage, index) => ({
    week: `${monthAbbr} ${weekDates[index]}`,
    previousMonth: Math.round(previousTotal * previousWeeklyPercentages[index]),
    currentMonth: Math.round(currentTotal * percentage),
  }));
};

// Function to get month name with proper formatting
const getMonthWeekLabel = (monthName: string, weekIndex: number) => {
  const monthAbbr = monthName.slice(0, 3);
  const weekDates = [1, 8, 15, 22, 29];
  return `${monthAbbr} ${weekDates[weekIndex]}`;
};

function formatAmount(amount: number): string {
  if (amount < 1) return '<$1';
  if (amount < 1000) return `$${Math.floor(amount)}`;
  if (amount < 100000) {
    const k = amount / 1000;
    return Number.isInteger(k) ? `$${k.toFixed(0)}k` : `$${k.toFixed(1)}k`;
  }
  const rounded = Math.round(amount / 50_000) * 50_000;
  return `$${(rounded / 1000).toFixed(0)}k`;
}

// Transform real transaction data into chart format
const transformTransactionsToChartData = (transactions: any[], categories: any[]): Record<string, CategoryData[]> => {
  const monthlyData: Record<string, CategoryData[]> = {};
  const currentYear = new Date().getFullYear();
  
  // Initialize all months with empty data
  MONTHS.forEach(month => {
    monthlyData[month] = [];
  });

  // Filter transactions for current year only
  const currentYearTransactions = transactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date.getFullYear() === currentYear;
  });

  console.log(`Analytics - Total transactions: ${transactions.length}, Current year (${currentYear}): ${currentYearTransactions.length}`);

  // Group transactions by month
  const transactionsByMonth = currentYearTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthName = MONTHS[date.getMonth()];
    
    if (!acc[monthName]) {
      acc[monthName] = [];
    }
    acc[monthName].push(transaction);
    return acc;
  }, {} as Record<string, any[]>);

  console.log(`Analytics - Months with data: ${Object.keys(transactionsByMonth).join(', ')}`);

  // Process each month
  MONTHS.forEach(monthName => {
    const monthTransactions = transactionsByMonth[monthName] || [];
    
    if (monthTransactions.length === 0) {
      // No transactions for this month
      monthlyData[monthName] = [];
      return;
    }
    
    // Group by category
    const categoryTotals = monthTransactions.reduce((acc: Record<string, number>, transaction: any) => {
      const categoryId = transaction.categoryId;
      const category = categories.find(c => c.id === categoryId);
      const categoryName = category?.name || 'Unknown';
      
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      
      // All transactions should already be expenses from the API, but double-check
      if (transaction.type === 'expense') {
        acc[categoryName] += parseFloat(transaction.amount);
      }
      
      return acc;
    }, {} as Record<string, number>);

    // Calculate total for percentages
    const values = Object.values(categoryTotals) as number[];
    const total = values.reduce((sum: number, value: number) => sum + value, 0);
    
    console.log(`Analytics - ${monthName}: ${monthTransactions.length} transactions, $${total.toFixed(2)} total, ${Object.keys(categoryTotals).length} categories`);
    if (monthName === 'January') {
      console.log(`Analytics - January categories detail:`, Object.entries(categoryTotals).map(([name, value]) => `${name}: $${(value as number).toFixed(2)}`).join(', '));
    }
    
    // Convert to chart data format and sort by value
    const allCategoryData: CategoryData[] = Object.entries(categoryTotals)
      .map(([categoryName, value], index) => {
        // Find the category to get its color
        const category = categories.find(c => c.name === categoryName);
        return {
          name: categoryName,
          value: Math.round(value as number),
          percentage: total > 0 ? ((value as number) / total) * 100 : 0, // Keep precise percentage for now
          color: category?.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length], // Use category color or fallback
        };
      })
      .filter(item => item.value > 0) // Only include categories with spending
      .sort((a, b) => b.value - a.value); // Sort by value descending

    // Group top 7 categories + combine rest into "Other"
    let chartData: CategoryData[];
    if (allCategoryData.length <= 7) {
      // If 7 or fewer categories, show all
      chartData = allCategoryData;
    } else {
      // Take top 7 and combine rest into "Other"
      const top7 = allCategoryData.slice(0, 7);
      const remaining = allCategoryData.slice(7);
      
      const otherValue = remaining.reduce((sum, item) => sum + item.value, 0);
      const otherPercentage = total > 0 ? (otherValue / total) * 100 : 0;
      
      if (otherValue > 0) {
        const otherCategory: CategoryData = {
          name: 'Other',
          value: otherValue,
          percentage: otherPercentage,
          color: '#9CA3AF' // Gray color for Other category
        };
        chartData = [...top7, otherCategory];
      } else {
        chartData = top7;
      }
    }

    // Ensure percentages add up to exactly 100%
    const totalPercentage = chartData.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage > 0 && totalPercentage !== 100 && chartData.length > 0) {
      // Adjust the largest category to make total exactly 100%
      const largest = chartData[0];
      largest.percentage = largest.percentage + (100 - totalPercentage);
    }
    
    // Round percentages for display after adjustment
    chartData.forEach(item => {
      item.percentage = Math.round(item.percentage * 10) / 10; // Round to 1 decimal place
    });

    const finalTotal = chartData.reduce((sum, item) => sum + item.percentage, 0);
    console.log(`Analytics - ${monthName} final chart data: ${chartData.length} categories, total: ${finalTotal.toFixed(1)}%`);
    console.log(`Analytics - ${monthName} categories: ${chartData.map(c => `${c.name}(${c.percentage.toFixed(1)}%)`).join(', ')}`);
    monthlyData[monthName] = chartData;
  });

  return monthlyData;
};

export const DonutChartContainer = () => {
  const { hasConnectedBanks, loading: bankLoading } = useBankStatus();
  const router = useRouter();
  const flatRef = React.useRef<FlatList>(null);
  // Debug: Show what month we're defaulting to
  const defaultMonth = MONTHS[0]; // January
  const currentDate = new Date();
  const currentMonthName = MONTHS[currentDate.getMonth()];
  console.log(`Analytics - Default month: ${defaultMonth}, Current month: ${currentMonthName}`);
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [data, setData] = useState<CategoryData[]>([]);
  const [realData, setRealData] = useState<Record<string, CategoryData[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monthly' | 'comparison'>('monthly');
  const totalValue = useSharedValue(0);
  const decimals = useSharedValue<number[]>([]);

  // Load real data when component mounts or bank status changes
  useEffect(() => {
    if (hasConnectedBanks) {
      loadRealData();
    }
  }, [hasConnectedBanks]);

  // Refresh data when screen comes into focus (e.g., returning from swipe screen)
  useFocusEffect(
    React.useCallback(() => {
      if (hasConnectedBanks) {
        loadRealData();
      }
    }, [hasConnectedBanks])
  );

  const loadRealData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData] = await Promise.all([
        plaidService.getCategorizedTransactions(),
        plaidService.getUserCategories(),
      ]);

      console.log('Analytics - Transactions:', transactionsData.transactions?.length || 0);
      console.log('Analytics - Categories:', categoriesData.categories?.length || 0);
      console.log('Analytics - Sample transaction:', transactionsData.transactions?.[0]);

      const transformedData = transformTransactionsToChartData(
        transactionsData.transactions || [],
        categoriesData.categories || []
      );
      
      console.log('Analytics - Transformed data keys:', Object.keys(transformedData));
      console.log('Analytics - January data:', transformedData['January']?.length || 0, 'categories');
      console.log('Analytics - Selected month data:', transformedData[selectedMonth]?.length || 0, 'categories for', selectedMonth);
      
      // Debug January specifically
      if (transformedData['January']) {
        console.log('Analytics - January categories:', transformedData['January'].map(c => `${c.name}: $${c.value}`));
      }

      setRealData(transformedData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Fallback to dummy data if real data fails
      setRealData(DUMMY_DATA);
    } finally {
      setLoading(false);
    }
  };

  // Update chart when selected month changes
  React.useEffect(() => {
    // Use real data if available, otherwise fallback to dummy data
    const dataSource = Object.keys(realData).length > 0 ? realData : DUMMY_DATA;
    const monthData = dataSource[selectedMonth] || [];
    
    console.log(`Analytics - Chart Update: selectedMonth=${selectedMonth}`);
    console.log(`Analytics - Data source: ${Object.keys(realData).length > 0 ? 'REAL' : 'DUMMY'} data`);
    console.log(`Analytics - Available months in data: ${Object.keys(dataSource).join(', ')}`);
    console.log(`Analytics - Month data for ${selectedMonth}: ${monthData.length} categories`);
    if (monthData.length > 0) {
      console.log(`Analytics - Categories: ${monthData.map(c => `${c.name}($${c.value})`).join(', ')}`);
    }
    
    setData(monthData);
    const total = monthData.reduce((acc, item) => acc + item.value, 0);
    totalValue.value = withTiming(total, { duration: 400 });

    if (monthData.length === 0 || total === 0) {
      // No data for this month - set empty decimals
      decimals.value = [];
    } else {
      // Ensure each slice has a minimum visible length
      const MIN_VISIBLE = 0.07; // 6% of circle
      const decimalsRaw = monthData.map(item => item.percentage / 100);
      const boosted = decimalsRaw.map(d => Math.max(d, MIN_VISIBLE));
      const sumBoosted = boosted.reduce((a, b) => a + b, 0);
      decimals.value = boosted.map(d => d / sumBoosted);
    }
  }, [selectedMonth, realData]);

  const font = useFont(require('../../components/protected/donut/fonts/Roboto-Bold.ttf'), 60);

  if (!font) {
    return <View />;
  }

  const totalAmount = data.reduce((acc, item) => acc + item.value, 0);
  const formattedTotal = totalAmount > 0 ? formatAmount(totalAmount) : "No Data";
  
  // Extract actual category colors from data
  const categoryColors = data.map(item => item.color || '#9CA3AF');
  
  // Dynamic n based on actual data length (max 8 for 7 categories + Other)
  const n = Math.max(data.length, 8);

  // Get previous month for comparison  
  const currentMonthIndex = MONTHS.indexOf(selectedMonth);
  const previousMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : MONTHS.length - 1;
  const previousMonth = MONTHS[previousMonthIndex];
  
  // Use real data if available, otherwise fallback to dummy data
  const dataSource = Object.keys(realData).length > 0 ? realData : DUMMY_DATA;

  // Get weekly data for current month
  const previousMonthData = dataSource[previousMonth] || [];
  const weeklyData = generateWeeklyData(data, previousMonthData, selectedMonth);

  // Show page blocker if no bank accounts are connected
  if (!bankLoading && !hasConnectedBanks) {
    return (
      <PageBlocker
        title="Connect Your Bank"
        message="You need to connect a bank account to view your spending analytics and insights. Connect your account to see your financial data!"
      />
    );
  }

  // Show loading while data is being fetched
  if (bankLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[
              styles.optionsButton,
              activeTab === 'monthly' && styles.activeTab,
              activeTab !== 'monthly' && styles.inactiveTab
            ]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[
              styles.year,
              activeTab !== 'monthly' && styles.inactiveTabText
            ]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.optionsButton, 
              { width: 180 },
              activeTab === 'comparison' && styles.activeTab,
              activeTab !== 'comparison' && styles.inactiveTab
            ]}
            onPress={() => setActiveTab('comparison')}
          >
            <Text style={[
              styles.year,
              activeTab !== 'comparison' && styles.inactiveTabText
            ]}>Comparison</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'monthly' ? (
          <>
      {/* Month Selector Row - momentum snap scroller */}
      <FlatList
        ref={flatRef}
        data={MONTHS}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={e => {
          const rawIdx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
          const idx = Math.max(0, Math.min(MONTHS.length - 1, rawIdx));
          const month = MONTHS[idx];
          if (month && month !== selectedMonth) {
            setSelectedMonth(month);
          }
        }}
        onScrollEndDrag={() => {}}  // no-op to avoid premature state
        onMomentumScrollEnd={e => {
          const offset = e.nativeEvent.contentOffset.x;
          const rawIdx = Math.round(offset / ITEM_WIDTH);
          const index = Math.max(0, Math.min(MONTHS.length - 1, rawIdx));
          setSelectedMonth(MONTHS[index]);
        }}
        contentContainerStyle={[
          styles.monthSelectorRow,
          {paddingHorizontal: 0},
        ]}
        ListHeaderComponent={<View style={{width: SIDE_PAD}} />}
        ListFooterComponent={<View style={{width: SIDE_PAD}} />}
        renderItem={({item, index}) => (
          <TouchableOpacity
            style={[
              styles.monthButton,
              {width: ITEM_WIDTH, alignItems: 'center'},
              selectedMonth === item && styles.selectedMonthButton,
            ]}
            onPress={() => {
              const idx = MONTHS.indexOf(item);
              flatRef.current?.scrollToOffset({offset: idx * ITEM_WIDTH, animated: true});
            }}
          >
            <Text
              style={[
                styles.monthButtonText,
                selectedMonth === item && styles.selectedMonthButtonText,
                selectedMonth === item ? null : {opacity: 0.5},
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.chartContainer}>
        <DonutChart
          radius={RADIUS}
          gap={GAP}
          strokeWidth={STROKE_WIDTH}
          outerStrokeWidth={OUTER_STROKE_WIDTH}
          font={font}
          totalValue={totalValue}
          n={n}
          decimals={decimals}
          colors={categoryColors}
          formattedTotal={formattedTotal}
        />
      </View>
        <View style={styles.categoryContainer}>
          {Array.from({ length: Math.ceil(data.length / 2) }).map((_, rowIdx) => {
            const left = data[rowIdx * 2];
            const right = data[rowIdx * 2 + 1];
            return (
              <View key={rowIdx} style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  {left && <RenderItem item={left} />}
                </View>
                <View style={{ flex: 1 }}>
                  {right && <RenderItem item={right} />}
                </View>
              </View>
            );
          })}
        </View>
          </>
        ) : (
          <>
            {/* Month Selector for Comparison */}
            <FlatList
              ref={flatRef}
              data={MONTHS}
              horizontal
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={e => {
                const rawIdx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
                const idx = Math.max(0, Math.min(MONTHS.length - 1, rawIdx));
                const month = MONTHS[idx];
                if (month && month !== selectedMonth) {
                  setSelectedMonth(month);
                }
              }}
              onMomentumScrollEnd={e => {
                const offset = e.nativeEvent.contentOffset.x;
                const rawIdx = Math.round(offset / ITEM_WIDTH);
                const index = Math.max(0, Math.min(MONTHS.length - 1, rawIdx));
                setSelectedMonth(MONTHS[index]);
              }}
              contentContainerStyle={[
                styles.monthSelectorRow,
                {paddingHorizontal: 0},
              ]}
              ListHeaderComponent={<View style={{width: SIDE_PAD}} />}
              ListFooterComponent={<View style={{width: SIDE_PAD}} />}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  style={[
                    styles.monthButton,
                    {width: ITEM_WIDTH, alignItems: 'center'},
                    selectedMonth === item && styles.selectedMonthButton,
                  ]}
                  onPress={() => {
                    const idx = MONTHS.indexOf(item);
                    flatRef.current?.scrollToOffset({offset: idx * ITEM_WIDTH, animated: true});
                  }}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      selectedMonth === item && styles.selectedMonthButtonText,
                      selectedMonth === item ? null : {opacity: 0.5},
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.comparisonContainer}>
              <ComparisonChart
                data={weeklyData}
                previousMonthName={previousMonth}
                currentMonthName={selectedMonth}
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.historyContainer}
          onPress={() => router.push('/category-transactions-list' as any)}
        >
          <Text style={styles.history}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.manageCategoriesContainer}
          onPress={() => router.push('/manage-categories' as any)}
        >
          <Text style={styles.manageCategories}>Manage Categories</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    marginTop: 15,
    paddingLeft: 20,
    fontSize: 40,
    fontWeight: '600',
    color: '#6a12e4ff'
  },
  optionsContainer: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  optionsButton: {
    borderRadius: 100,
    backgroundColor: '#6a12e4ff',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 40,
  },
  year: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white'
  },
  monthSelectorRow: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  monthButton: {
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMonthButton: {
    backgroundColor: 'transparent',
  },
  monthButtonText: {
    color: 'black',
    fontSize: 20,
  },
  selectedMonthButtonText: {
    color: '#6D28D9',
    fontWeight: 'bold',
    fontSize: 20,
  },
  chartContainer: {
    marginTop: 35,
    width: RADIUS * 2 + 10,
    height: RADIUS * 2 + 20,
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },
  categoryContainer: {
    marginTop: 20,
    alignSelf: 'center', 
    minWidth: 220, 
    maxWidth: 380, 
    width: '100%',
    alignItems: 'center'
  },
  historyContainer: {
    marginTop: 35,
    borderRadius: 100,
    backgroundColor: '#cfcfcfff',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: 80,
    height: 40,
  },
  history: {
    fontSize: 15,
    fontWeight: '500',
  },
  activeTab: {
    backgroundColor: '#6D28D9',
    borderRadius: 100,
  },
  inactiveTab: {
    backgroundColor: '#c9c9c9ff',
    borderRadius: 100,
  },
  inactiveTabText: {
    color: 'black',
  },
  comparisonContainer: {
    marginTop: 35,
    width: '100%',
    alignItems: 'center',
  },
  manageCategoriesContainer: {
    marginTop: 15,
    borderRadius: 100,
    backgroundColor: '#6a12e4ff',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: 160,
    height: 40,
  },
  manageCategories: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
  },
});
export default DonutChartContainer;
