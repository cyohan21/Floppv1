import { useState, useEffect } from 'react'
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native'
import { router } from 'expo-router'
import { useRegister } from '../contexts/registerContext'
import { Ionicons } from '@expo/vector-icons'

export default function EmailScreen () {
    const {registerData, setRegisterData} = useRegister()
    const [name, setName] = useState(registerData.name)

    const handleContinue = () => {

        if (!name) {
            Alert.alert("Please enter a name.")
            return
        }
        if (name.trim().split(/\s+/).length < 2) {
            Alert.alert("Please enter both a first and last name.")
            return
        }


        setRegisterData({ ...registerData, name})
        router.push('/register-email')
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
            <Text style={styles.title}>What's your name?</Text>

            <TextInput 
                placeholder='Name'
                placeholderTextColor="#1a1919ff"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <TouchableOpacity style={styles.button} onPress={handleContinue}>
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
        backgroundColor: '#fff'
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
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