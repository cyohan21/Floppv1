import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../../src/config/environment';

export default function EmailScreen () {
    const { token } = useLocalSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    if (!token) {
        return (
            <View style={styles.errorContainer}>
                <Image source={require('../../assets/images/logo1.png')} style={{width: 100, height: 100}}/>
                <Text style={styles.errorTitle}>Oops! That link doesn't seem to work.</Text>
                <Text style={styles.errorMessage}>The link may have expired or been used already.</Text>
                <Text style={styles.errorRedirectLink} onPress={() => router.replace('/')}>Go home</Text>
            </View>
        )
    }
    const handleRedirectLogin = () => {
        router.replace('/(auth)/login')
        return
    }

    const handleRegister = async () => {
        if (!password || !confirmPassword) {
            Alert.alert("Please fill in the required fields.")
            return
        }
        if (password !== confirmPassword) {
              Alert.alert("Passwords don't match.")
              return
            }
        if (password.length < 8) {
            Alert.alert("Password length must be at least 8 characters long.")
            return
        }

        if (!hasUppercase || !hasLowercase || !hasSymbol) {
            Alert.alert("Password must contain at least one lowercase and uppercase letter, along with a symbol.")
            return
        }
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password })
            });
          if (response.ok) {
            Alert.alert("Password successfully reset.")
            router.replace('/login')
          }
    
          else {
            const data = await response.json()
            Alert.alert("Password reset failed", data.message || "Unknown error.")
          }
        }
        catch (error: any) {
          Alert.alert("Network error", error.message)
        }
    }

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/images/logo1.png')} style={styles.logo} />
            <Text style={styles.title}>Reset your password.</Text>
            <Text style={styles.subtext}>Passwords must contain at least one uppercase 
                and lowercase letter, along with a symbol.</Text>

            <TextInput 
                placeholder='new password'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput 
                placeholder='confirm new password'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleRedirectLogin}>
                <Text style={styles.backButtonText}>Back to sign in</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff'
    
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginTop: 50
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 20,
        color: '#000'
    },
    subtext: {
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center'
    },
    input: {
        width: '90%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#e6e6e6ff'
    },
    button: {
        width: '90%',
        backgroundColor: '#6D28D9',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center'
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    backButton: {
        marginTop: 10,
        width: '90%',
        paddingVertical: 15,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',

        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    backButtonText: {
        color: '#6D28D9',
        fontSize: 16,
        fontWeight: '600'
    },

    // Error page
    errorContainer: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 30
    },
    errorTitle: {
        marginTop: 10,
        fontSize: 24,
        fontWeight: '700'
    },
    errorMessage: {
        marginTop: 15,
        fontSize: 16
    },
    errorRedirectLink: {
        marginTop: 10,
        fontWeight: '500',
        color: 'blue'
    }
})