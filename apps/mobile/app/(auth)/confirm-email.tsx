import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../../src/config/environment';
import { useAuth } from '../contexts/authContext'
import { useVerify } from '../contexts/verifyContext'
import { useRateLimit } from '../hooks/useRateLimit'

export default function EmailScreen () {
    const {email, password} = useVerify()
    const [otp, setOtp] = useState('')
    const { login } = useAuth()

    const handleRedirectLogin = () => {
        router.replace('/(auth)/login')
        return
    }

    const otpRateLimit = useRateLimit({
            maxAttempts: 3,
            windowMs: 5 * 60 * 1000,
            cooldownMs: 30 * 1000
        })
    
    const handleResend = async () => {
        const { allowed, message } = otpRateLimit.isAllowed()
        if (!allowed) {
            Alert.alert("Too many attempts", message)
            return
        }
    
        otpRateLimit.recordAttempt()
        
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/email-otp/send-verification-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, type: 'email-verification' })
            });
            if (response.ok) {
            Alert.alert("Confirmation email resent. Please check your inbox.")
            return
        }
        else {
            const data = await response.json()
            Alert.alert("An error occured", data.message || "Unknown error.")
        }
        }
        catch (error: any) {
          Alert.alert("Network error", error.message)
        }
    }

    const handleRegister = async () => {
        console.log("button pressed.")
        if (!otp) {
          Alert.alert("Please fill in all required fields.")
          return
        }
        if (otp.length !== 6) {
            Alert.alert("Code must be 6 digits.")
            return
        }
    
        try {
          const response = await fetch(`${config.apiBaseUrl}/auth/email-otp/verify-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, otp })
          })
          if (response.ok) {
            console.log("Got a response", response)
           
           // Add delay to ensure backend has updated verification status
           console.log("Email verified, waiting before login...")
           await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
           
            const loginResponse = await fetch(`${config.apiBaseUrl}/auth/sign-in/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
                
            })
            console.log("Request sent", email, password)
            if (loginResponse.ok) {
                const loginData = await loginResponse.json()

                if (loginData.token && loginData.user) {
                    await AsyncStorage.setItem('authToken', loginData.token)
                    await login(loginData.token, loginData.user)
                    router.replace('/(protected)/home')
                }
                else {
                    Alert.alert("Registration complete!", "Please log in with your credentials.", [
                    { text: "OK", onPress: () => router.replace('/(auth)/login') }
                ])
                }
            }
            else {
                const data = await loginResponse.json()
                Alert.alert("Verification failed", data.message || "Unknown error.")
            }
          }
    
          else {
            const data = await response.json()
            Alert.alert("Verification Failed", data.message || "Unknown error.")
          }
        }
        catch (error: any) {
          Alert.alert("Network error", error.message)
        }
      }

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/images/logo1.png')} style={styles.logo} />
            <Text style={styles.title}>One last step.</Text>
            <Text style={styles.subtext}>Enter the 6 digit code sent to {email}.</Text>

            <TextInput 
                placeholder='Code'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
            />

            <Text style={styles.bottomText}>Didn't get an email? 
                <Text style={{color: 'blue'}} onPress={handleResend}> Click here </Text>
                to resend an email.</Text>

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
    bottomText: {
        marginBottom: 20
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
    }
})