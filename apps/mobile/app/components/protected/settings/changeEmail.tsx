import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { config } from '../../../src/config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const handleEmailChange = async (email: string) => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        if (!email) {
            Alert.alert("Please enter a new email.")
            return
        }
        if (!validEmail) {
            Alert.alert("Pleas enter a valid email.")
            return
        }

        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${config.apiBaseUrl}/auth/change-email`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newEmail:email, callbackURL: `${config.customUrlScheme}login` })
                })
            if (response.ok) {
                Alert.alert("Email change sent", "Please approve the email change sent to your current email.")
            }
            else {
                const data = await response.json()
                Alert.alert("Name change failed", data.message || "Unknown error.")
                return
                }
        }
        catch (err: any) {
            Alert.alert('Network Error', err.message)
        }
}


