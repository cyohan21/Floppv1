import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { config } from '../../../../src/config/environment';


export const handleNameChange = async (name: string) => {
        if (!name) {
            Alert.alert("Please enter a name.")
            return
        }
        if (name.trim().split(/\s+/).length < 2) {
            Alert.alert("Please enter both a first and last name.")
            return
        }
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/update-user`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name })
                })
            if (response.ok) {
                Alert.alert("Name successfully changed", "Please log out and log back in to see the changes.")
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


