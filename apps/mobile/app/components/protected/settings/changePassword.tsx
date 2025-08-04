import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import { config } from '../../../../src/config/environment';

type ChangePasswordProps = {
  onClose: () => void;
}

export default function ChangePassword({ onClose }: ChangePasswordProps) {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);

    const HandleChange = async () => {
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            Alert.alert('Error', 'Please fill in all fields.')
            return
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert('Error', 'New password must match the confirmation.')
            return
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters long.")
            return
        }

        if (!hasUppercase || !hasLowercase || !hasSymbol) {
            Alert.alert("Error", "Password must contain at least one uppercase letter, one lowercase letter, and one symbol.")
            return
        }
        
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: oldPassword, 
                    newPassword, 
                    revokeOtherSessions: true
                })
            })
            
            if (response.ok) {
                Alert.alert("Success", "Password changed successfully!", [
                    { text: "OK", onPress: onClose }
                ])
            } else {
                const data = await response.json()
                if (data.message.includes('Invalid password')) {
                    Alert.alert('Error', 'The current password you entered is incorrect.')
                    return
                }
                Alert.alert("Error", data.message || "Failed to change password.")
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
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Enter your current password and choose a new secure password.</Text>
            
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={'#999'}
                    placeholder={'Enter your current password'}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry
                />
            </View>
            
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={'#999'}
                    placeholder={'Enter your new password'}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />
            </View>
            
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={'#999'}
                    placeholder={'Confirm your new password'}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry
                />
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={[styles.requirement, newPassword.length >= 8 && styles.requirementMet]}>
                    • At least 8 characters
                </Text>
                <Text style={[styles.requirement, hasUppercase && styles.requirementMet]}>
                    • One uppercase letter
                </Text>
                <Text style={[styles.requirement, hasLowercase && styles.requirementMet]}>
                    • One lowercase letter
                </Text>
                <Text style={[styles.requirement, hasSymbol && styles.requirementMet]}>
                    • One symbol
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleCancel} style={[styles.button, styles.cancelButton]}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={HandleChange} style={[styles.button, styles.saveButton]}>
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
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderRadius: 12,
        width: '100%',
        height: 48,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    requirementsContainer: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    requirement: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    requirementMet: {
        color: '#22c55e',
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
        flex: 1,
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