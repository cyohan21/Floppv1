import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../../src/config/environment';
import { useRateLimit } from '../hooks/useRateLimit';


export default function EmailScreen () {
    const [email, setEmail] = useState('')
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const resetRateLimit = useRateLimit({
        maxAttempts: 3,
        windowMs: 30 * 60 * 1000, 
        cooldownMs: 30 * 1000 
    })

    const handleReset = async () => {
        if (!email) {
            Alert.alert("Please enter an email.")
            return
        }
        if (!validEmail) {
            Alert.alert("Pleas enter a valid email.")
            return
        }
        
        const { allowed, message } = resetRateLimit.isAllowed()
        if (!allowed) {
            Alert.alert("Too many requests", message)
            return
        }
        resetRateLimit.recordAttempt()

        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/forget-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            })
            if (response.ok) {
                Alert.alert("Reset Link Sent", 
                    "A reset link has been sent to your email, please check your inbox.")
            }
            else {
                const data = await response.json()
                Alert.alert("An error occured", data.message || "Unknown error")
            }
        }
        catch (err: any) {
            Alert.alert("Network error", err.message)
        }

    }

    return (
        <View style={styles.container}>
            <Image source={require('../../assets/images/logo1.png')} style={styles.logo} />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtext}>Please enter the email associated with your account.</Text>

            <TextInput 
                placeholder='Email'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={email.toLowerCase()}
                onChangeText={setEmail}
                keyboardType="email-address"
            />

            <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.buttonText}>Send Reset Link</Text>
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
    }
})