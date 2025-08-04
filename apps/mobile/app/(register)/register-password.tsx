import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../../src/config/environment';
import { useRegister } from '../contexts/registerContext';

export default function EmailScreen () {
    const {registerData, setRegisterData} = useRegister()
    const [password, setPassword] = useState(registerData.password)
    const [confirmPassword, setConfirmPassword] = useState('')

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

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
          setRegisterData({...registerData, password})
          const response = await fetch(`${config.apiBaseUrl}/auth/sign-up/email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: registerData.name,
                email: registerData.email,
                password
             })
          })
          if (response.ok) {
            router.dismissAll()
            router.replace('/register-otp')
          }
    
          else {
            const data = await response.json()
            Alert.alert("Registration failed", data.message || "Unknown error.")
          }
        }
        catch (error: any) {
          Alert.alert("Network error", error.message)
        }
    }

    const handleBack = () => {
        router.back()
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#6a12e4" />
            </TouchableOpacity>
            <Image source={require('../../assets/images/logo1.png')} style={styles.logo} />
            <Text style={styles.title}>Enter a secure password.</Text>
            <Text style={styles.subtext}>Passwords must contain at least one uppercase 
                and lowercase letter, along with a symbol.</Text>

            <TextInput 
                placeholder='Password'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput 
                placeholder='Confirm password'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Continue</Text>
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
        padding: 10,
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