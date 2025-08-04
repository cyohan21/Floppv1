import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../../../src/config/environment';

type NotificationPreferencesProps = {
  onClose: () => void;
}

type NotificationFrequency = 'daily' | 'few_times_week' | 'weekly' | 'off';

export default function NotificationPreferences({ onClose }: NotificationPreferencesProps) {
    const [selectedFrequency, setSelectedFrequency] = useState<NotificationFrequency>('daily')

    const notificationOptions = [
        { value: 'daily', label: 'Once a day' },
        { value: 'few_times_week', label: 'Few times a week' },
        { value: 'weekly', label: 'Once a week' },
        { value: 'off', label: 'Turn off notifications' },
    ] as const;

    const handleSave = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/user/notification-preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ frequency: selectedFrequency })
            })
            
            if (response.ok) {
                Alert.alert("Success", "Notification preferences updated successfully!", [
                    { text: "OK", onPress: onClose }
                ])
            } else {
                const data = await response.json()
                Alert.alert("Error", data.message || "Failed to update preferences.")
            }
        } catch (err: any) {
            Alert.alert('Network Error', err.message)
        }
    }

    const handleCancel = () => {
        onClose()
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notification Preferences</Text>
            <Text style={styles.subtitle}>Choose how often you'd like to receive notifications about your spending.</Text>
            
            <View style={styles.optionsContainer}>
                {notificationOptions.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[
                            styles.optionButton,
                            selectedFrequency === option.value && styles.selectedOption
                        ]}
                        onPress={() => setSelectedFrequency(option.value)}
                    >
                        <View style={styles.optionContent}>
                            <Text style={[
                                styles.optionLabel,
                                selectedFrequency === option.value && styles.selectedLabel
                            ]}>
                                {option.label}
                            </Text>
                        </View>
                        <View style={[
                            styles.radioButton,
                            selectedFrequency === option.value && styles.radioButtonSelected
                        ]}>
                            {selectedFrequency === option.value && (
                                <View style={styles.radioButtonInner} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCancel} style={[styles.button, styles.cancelButton]}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.button, styles.saveButton]}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        marginTop: 20,
        fontSize: 28,
        fontWeight: '600',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 10,
        textAlign: 'center',
        marginBottom: 25,
        color: '#666',
        lineHeight: 20,
    },
    optionsContainer: {
        width: '100%',
        marginBottom: 30,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedOption: {
        backgroundColor: '#e8f4ff',
        borderColor: '#6a12e4ff',
    },
    optionContent: {
        flex: 1,
        marginRight: 12,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectedLabel: {
        color: '#6a12e4ff',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioButtonSelected: {
        borderColor: '#6a12e4ff',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#6a12e4ff',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    saveButton: {
        backgroundColor: '#6a12e4ff',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '500',
    },
}) 