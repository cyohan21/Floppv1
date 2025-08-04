// currently not in use.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Button, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { config } from '../src/config/environment';

export default function TransactionForm({ onClose }: { onClose: () => void }) {
  const [strAmount, setStrAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [merchant, setMerchant] = useState('')

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    hideDatePicker();
  };


  const createTransaction = async () => {
      const amount = parseFloat(strAmount)
      if (isNaN(amount) || amount < 0) {
        Alert.alert("Please enter a valid number, that is greater than zero")
        return
      }
      try {
        const token = await AsyncStorage.getItem('authToken')
        const response = await fetch(`${config.apiBaseUrl}/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, date: selectedDate.toISOString(), description, merchant, categoryName }) // Turns into an object, but keeps variable types intact.
        })
        if (response.ok) {
          Alert.alert("Transaction added.")
        }
        else {
          const data = await response.json()
          Alert.alert("Transaction could not be added", data.error || "Unknown error.")
        }
      }
      catch (err: any) {
          Alert.alert("Network error", err.message)
        }
  }   
  
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
            <Image source={require('../../assets/images/logo1.png')} style={styles.logo} />
              <Text style={styles.title}>Add Transaction</Text>
              <Text style={styles.text}>Amount</Text>
              <TextInput
              style={styles.input}
              placeholder="How much did you spend this time?"
              value={strAmount}
              onChangeText={setStrAmount}
              />
              <Text style={styles.text}>Date</Text>
              <Button title="Pick a date" onPress={showDatePicker} />
              <Text style={{ marginTop: 20 }}>Selected: {selectedDate.toDateString()}</Text>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                maximumDate={new Date()}
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
              />
              <Text style={styles.text}>Description</Text>
              <TextInput
              style={styles.input}
              placeholder="Tell me more..."
              value={description}
              onChangeText={setDescription}
              />
              <Text style={styles.text}>Category</Text>
              <TextInput
              style={styles.input}
              placeholder="Choose from one of the categories provided."
              value={categoryName}
              onChangeText={setCategoryName}
              />
              <Text style={styles.text}>Merchant</Text>
              <TextInput
              style={styles.input}
              placeholder="Who robbed you?"
              value={merchant}
              onChangeText={setMerchant}
              />
              <TouchableOpacity style={styles.button} onPress={createTransaction}>
              <Text style={styles.buttonText}>Finish</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: 'red', marginTop: 20 }}>Close</Text>
              </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
    )
        
    }
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: "flex-start",
        padding: 16,
      },
      innerContainer: {
        alignItems: 'center'
      },
      logo: {
        height: 100,
        width: 100
      },
      title: {
        fontSize: 24,
        fontWeight: '600',
      },
      text: {
        marginTop: 10,
        marginBottom: 10
      },
      input: {
        width: "100%",
        maxWidth: 300,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 12
      },
      button: {
        backgroundColor: '#6a12e4ff',
        padding: 12,
        marginTop: 10,
        borderRadius: 8,
        alignItems: 'center',
        width: 150
      },
      buttonText: {
        color: "#fff",
        fontWeight: 'bold',
        fontSize: 16
      }
    })
    