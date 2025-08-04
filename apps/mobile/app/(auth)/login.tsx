import React, { useState } from "react"
import { router } from "expo-router"
import { Alert, View, StyleSheet, Text, TextInput, TouchableOpacity, Image, ScrollView } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from "../contexts/authContext"
import { useVerify } from "../contexts/verifyContext"
import { useRateLimit } from '../hooks/useRateLimit'
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Linking from 'expo-linking';
import { config } from '../../src/config/environment';

export default function Login() {
    const [usernameOrEmail, setUsernameOrEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const { login } = useAuth()
    const { setEmail, setPassword } = useVerify();

    // Rate limiter
    const loginRateLimit = useRateLimit({
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        cooldownMs: 3 * 1000 // 3 seconds between attempts
    })

    let endpoint: string;
    let body: string;

    const RegisterButton = async () => {
      router.replace('/')
    }

    const handleForgotPassword = async () => {
      router.replace('/forgot-password')
    }

    const handleBack = () => {
      router.back()
    }
    // Oauth sign in not properly implemented yet.
    // const handleGoogle = async () => {
    //   try {
    //     const response = await fetch(`https://api.example.com/api/auth/sign-in/social`
    //             , {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({provider: "google", callbackURL: 'myapp://home'})
    //         })
    //         const data = await response.json();
    //         if (data.redirect && data.url) {
    //           console.log(data)
    //           Linking.openURL(data.url); // This opens the Google OAuth page
    //           return;
    //         }
    //         else {
    //             const data = await response.json()
    //             Alert.alert("Login failed", data.message || "Unknown error.")
    //         }
    //   }
    //   catch (error: any) {
    //           Alert.alert("Network error", error.message)
    //     }
    // }

    // const handleFacebook = async () => {
    //   try {
    //     const response = await fetch(`https://api.example.com/api/auth/sign-in/social`
    //             , {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({provider: "facebook", callbackURL: 'myapp://'})
    //         })
    //         const data = await response.json();
    //         if (data.redirect && data.url) {
    //           console.log(data)
    //           Linking.openURL(data.url);
    //           return;
    //         }
    //         else {
    //             const data = await response.json()
    //             Alert.alert("Login failed", data.message || "Unknown error.")
    //         }
    //   }
    //   catch (error: any) {
    //           Alert.alert("Network error", error.message)
    //     }
    // }


    const HandleLogin = async () => {
        const { allowed, message } = loginRateLimit.isAllowed()
        if (!allowed) {
          Alert.alert("Too many attempts", message)
          return
        }
        loginRateLimit.recordAttempt()

        console.log("Button pressed.")
        if (!usernameOrEmail || !loginPassword) {
            Alert.alert("Please fill in all required fields.")
            return
        }

      
        if (usernameOrEmail.includes("@")) {
            endpoint = "/auth/sign-in/email"
            body = JSON.stringify({ email: usernameOrEmail, password: loginPassword })
        }
        else {
          endpoint = "/auth/sign-in/username" 
          body = JSON.stringify({ username: usernameOrEmail, password: loginPassword })
        }
        try {
            const response = await fetch(`${config.apiBaseUrl}${endpoint}`
                , {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
            })
            console.log("logging in with:", usernameOrEmail, loginPassword, endpoint)
            console.log("Response status:", response.status)
            console.log("Response headers:", response.headers)
            
            // Log raw response text first
            const responseText = await response.text()
            console.log("Raw response:", responseText)
            
            if (response.ok) {
                try {
                    const data = JSON.parse(responseText)
                    console.log("Parsed login data:", data)
                    // better-auth returns { token, user } directly
                    if (data.token && data.user) {
                        await login(data.token, data.user)
                    } else {
                        console.log("Unexpected response format:", data)
                        Alert.alert("Login failed", "Unexpected response format from server.")
                    }
                } catch (parseError) {
                    console.error("JSON parse error:", parseError)
                    Alert.alert("Login failed", "Invalid response from server.")
                }
            }
            else {
                try {
                    const data = JSON.parse(responseText)
                    console.log("Error response:", data)
                    if (data.message === "Email not verified") { // Error message given only if login through email.
                        setEmail(usernameOrEmail.toLowerCase())
                        setPassword(loginPassword)
                        const response = await fetch(`${config.apiBaseUrl}/auth/email-otp/send-verification-otp`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({email: usernameOrEmail, type: 'email-verification' })
                        })
                        if (response.ok) {
                          router.replace('/(auth)/confirm-email')
                          return
                        }
                        else {
                          Alert.alert("Login failed", "Please verify your email first before signing in.")
                          return
                        }
                    }
                    Alert.alert("Login failed", data.message || "Unknown error.")
                } catch (parseError) {
                    console.error("Error response parse error:", parseError)
                    Alert.alert("Login failed", "Invalid error response from server.")
                }
            }
        }
        catch (error: any) {
              Alert.alert("Network error", error.message)
        }
    }

        return (
     <ScrollView contentContainerStyle={styles.container} style={{backgroundColor: 'white'}}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#6a12e4" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign in</Text>
          <TextInput
          style={styles.input}
          placeholder="username or email"
          value={usernameOrEmail.toLowerCase()}
          onChangeText={setUsernameOrEmail}
          keyboardType="email-address"
          />
          <TextInput
          style={styles.input}
          placeholder="password"
          value={loginPassword}
          onChangeText={setLoginPassword}
          secureTextEntry
          />
          <Text style={styles.subtext} onPress={handleForgotPassword}>Forgot password?</Text>
          <TouchableOpacity style={styles.button} onPress={HandleLogin}>
          <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          {/* <View style={styles.orWrapper}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
        </View> */}

          {/* <TouchableOpacity style={styles.googleButton} onPress={handleGoogle}>
          <Image
            source={require('../../assets/images/googleLogo.png')}
            style={styles.googleLogo}
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.facebookButton} onPress={handleFacebook}>
          <Image
            source={require('../../assets/images/facebookLogo.png')}
            style={styles.facebookLogo}
          />
          <Text style={styles.facebookButtonText}>Continue with facebook</Text>
        </TouchableOpacity> */}

        <Text style={styles.bottomText}>Don't have an account?
                  <Text style={{color: "#6a12e4ff"}} onPress={RegisterButton}> Sign up.</Text>
                  </Text>
        </ScrollView>
        
)
    
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    height: 100,
    width: 100
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: "#000000ff",
  },
  input: {
    width: "75%",
    backgroundColor: '#e2e2e2ff',
    borderWidth: 1,
    borderColor: '#c5c5c5ff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    height: 50
  },
  subtext: {
    fontWeight: '500',
    textDecorationLine: 'underline'
  },
  button: {
    width: '75%',
    backgroundColor: '#6a12e4ff',
    padding: 12,
    marginTop: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50
  },
  buttonText: {
    color: "#ffffffff",
    fontWeight: 'bold',
    fontSize: 16
  },

  // ---- or ----
  orWrapper: {
  width: '75%',
  height: 30,
  justifyContent: 'center',
  alignItems: 'center',
  marginVertical: 24,
  position: 'relative',
},
line: {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: 1,
  backgroundColor: '#ccc',
},
orText: {
  backgroundColor: '#fff', // same as your screen background
  paddingHorizontal: 12,
  fontSize: 14,
  color: '#888',
  zIndex: 1,
},

  // Google

  googleButton: {
    marginTop: 7,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    width: '75%',
    alignItems: 'center',
    justifyContent: 'space-between',

    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    paddingRight: 30
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginLeft: 20,
  },

  // Facebook

  facebookButton: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1064ffff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    width: '75%',

    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  facebookButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffffff',
    fontWeight: '500',
    textAlign: 'center',
    paddingRight: 30
  },
  facebookLogo: {
    width: 20,
    height: 20,
    marginLeft: 20,
    resizeMode: 'contain',
  },

  bottomText: {
    marginTop: 30,
  }
})
