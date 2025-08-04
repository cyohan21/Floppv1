import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router, Link } from 'expo-router';
import { config } from '../src/config/environment';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/authContext'

export default function GetStarted() {
    const { isAuthenticated, loading } = useAuth();
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        // Wait for auth to complete and add a small buffer
        if (!loading) {
            const timer = setTimeout(() => {
                setIsReady(true);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [loading]);

    // If user is authenticated, redirect to home immediately
    useEffect(() => {
        if (isAuthenticated && isReady) {
            router.replace('/(protected)/home')
        }
    }, [isAuthenticated, isReady]);

    // Show loading while not ready OR if user is authenticated (prevent flash)
    if (!isReady || isAuthenticated) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6D28D9" />
            </View>
        );
    }

    const handleGetStarted = () => {
        router.push("/(register)/register-name")
    }

    const handleLogin = () => {
        router.push("/(auth)/login")
    }

    return (
        <View style={styles.container}>
            <Text style={styles.creditText}>App created by {config.appName} Inc.</Text>
            <Image source={require('../assets/images/logo2.png')} style={styles.logo} />

            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
                    <Text style={styles.getStartedButtonText}>Get Started</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
                <Text style={styles.bottomText}>By proceeding to use {config.appName}, you agree to our
                    <Link href="/terms-of-service">
                    <Text style={{color: 'blue'}}> Terms of Service </Text>
                    </Link>
                    and
                    <Link href="/privacy-policy">
                    <Text style={{color: 'blue'}}> Privacy Policy.</Text>
                    </Link>
                </Text>
            </View>

        </View>
    )
}

const styles = StyleSheet.create ({

    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    bottomContainer: {
        width: '85%',
        alignItems: 'center',
        position: 'absolute',
        bottom: '5%'
    },
    creditText: {
        position: 'absolute',
        top: '10%',
        fontWeight: '500'
    },
    logo: {
        height: 250,
        width: 250,
        marginBottom: 30
    },
    getStartedButton: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#6D28D9',
        paddingVertical: 15,
        marginTop: 50,
        alignItems: 'center'
        
    },
    getStartedButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    loginButton: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#fff',
        // ✨ shadow (iOS)
        shadowColor: '#000000ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,

        // ✨ shadow (Android)
        elevation: 5,
        
        marginTop: 10,
        paddingVertical: 15,
        alignItems: 'center'
    },
    loginButtonText: {
        color: '#6D28D9',
        fontSize: 16,
        fontWeight: '600'
    },
    bottomText: {
        marginTop: 15,
        textAlign: 'center',
        width: '95%',
        marginBottom: 10

    }
})