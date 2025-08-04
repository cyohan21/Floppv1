import { View, Text, TextInput, StyleSheet, TouchableOpacity, Switch, ScrollView, Modal, Alert, Linking } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/authContext'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'
import ChangePassword from '../../components/protected/settings/changePassword'
import NotificationPreferences from '../../components/protected/settings/notificationPreferences'
import { handleNameChange } from '../../components/protected/settings/updateUser'
import { handleEmailChange } from '../../components/protected/settings/changeEmail'
import WalkthroughScreen from '../../walkthrough'
import { plaidService } from '../../services/plaidService'
import popupStyles from "../../styles/popup"

export default function Settings () {
    const { user } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [currency, setCurrency] = useState('')
    const router = useRouter()
    const { logout } = useAuth()

    const [showChangePassword, setShowChangePassword] = useState(false)
    const [showNotificationPreferences, setShowNotificationPreferences] = useState(false)
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)
    const [showWalkthrough, setShowWalkthrough] = useState(false)
    const [selectedCurrency, setSelectedCurrency] = useState('USD')
    const [userCurrency, setUserCurrency] = useState('USD')
    const [currencyLoading, setCurrencyLoading] = useState(false)

    // Toggle
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled((prev) => !prev);

    // Load user's current currency on component mount
    useEffect(() => {
        const loadUserCurrency = async () => {
            try {
                const response = await plaidService.getUserProgress();
                if (response.progress) {
                    const currency = response.progress.currency || 'USD';
                    setUserCurrency(currency);
                    setSelectedCurrency(currency);
                }
            } catch (error) {
                console.error('Error loading user currency:', error);
                // Default to USD if error
                setUserCurrency('USD');
                setSelectedCurrency('USD');
            }
        };
        
        loadUserCurrency();
    }, []);

    const HandleChangeNotis = () => {
        setShowNotificationPreferences(true)
    }

    const HandleAbout = () => {
      router.push('/about')
      return
    }

    const HandleTOS = () => {
      router.push('/terms-of-service')
      return
    }

    const HandlePrivacyPolicy = () => {
      router.push('/privacy-policy')
    }

    const HandleContactSupport = () => {
      Linking.openURL('mailto:myapp@example.com');
      return
    }

    const HandleCurrencyChange = () => {
      setSelectedCurrency(userCurrency)
      setShowCurrencyPicker(true)
    }

    const selectCurrency = async (currency: string) => {
      try {
        setCurrencyLoading(true)
        setSelectedCurrency(currency)
        
        // Save to backend
        await plaidService.updateUserCurrency(currency)
        
        // Update local state
        setUserCurrency(currency)
        setShowCurrencyPicker(false)
        
        Alert.alert('Success', `Currency updated to ${currency}`)
        console.log('Currency successfully updated to:', currency)
      } catch (error) {
        console.error('Error updating currency:', error)
        Alert.alert('Error', 'Failed to update currency. Please try again.')
        setSelectedCurrency(userCurrency) // Revert to previous currency
      } finally {
        setCurrencyLoading(false)
      }
    }

      const HandleLogout = async () => {
        Alert.alert(
          'Logout',
          'Are you sure you want to log out?',
          [
            {text: 'Cancel', style: 'cancel',},
            {text: 'Log Out', style: 'destructive',
              onPress: async () => {
                await logout()
              }}],
          { cancelable: true }
        );
      }
    // Delete account: step 1
    const HandleDeleteAccount = () => {
    Alert.alert(
    'Are you sure?',
    'Do you really want to delete your account?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Continue',
        onPress: () => confirmWarningStep(),
      },
    ],
    { cancelable: true }
  );
};
    // Delete account: step 2
    const confirmWarningStep = () => {
      Alert.alert(
        'Final Warning',
        'Deleting your account will erase all data and can’t be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: () => finalIrreversibleStep(),
          },
        ],
        { cancelable: false }
      );
    };
    // Delete account: step 3
    const finalIrreversibleStep = () => {
      Alert.alert(
        'Last Confirmation',
        'This is your last chance. Are you absolutely sure?',
        [
          {
            text: 'Go Back',
            style: 'cancel',
          },
          {
            text: 'Yes, delete everything',
            style: 'destructive',
            onPress: () => actuallyDeleteAccount(),
          },
        ],
        { cancelable: false }
      );
    };
    // Delete account: step 4
    const actuallyDeleteAccount = async () => {
      try {
                const response = await fetch('https://api.example.com/api/auth/delete-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({callbackURL: '/'})
              })
              if (response.ok) {
                await logout()
                console.log('Account deleted');
                Alert.alert('Account Deleted', 'Your account has been permanently removed.');
              }
              else {
                const data = await response.json()
                Alert.alert('Account deletion failed', data.message || 'Unknown Error')
              }
              }
              catch (err: any) {
                Alert.alert('Network error', err.meessage)
              }
              
            }

    return (
      <View style={{backgroundColor: 'white'}}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Settings</Text>
          {/* Subscription
              <Text style={styles.subtext}>Subscription</Text>
              <View style={[styles.button, {height: 65,}]}>
                <Text style={[styles.buttonText, {color: '#0f68ddff'}]}>Subscription Type: Trial</Text>
                Change this to days until next billing cycle for premium users
                <Text style={{fontSize: 15, paddingTop: 5}}>Days Remaining: 15 </Text>
              </View>
                          Don't show this if they are subscribed
              <TouchableOpacity style={[styles.button, {width: '80%', backgroundColor: '#6a12e4ff'}]}>
                <Text style={[styles.buttonText, {color: 'white'}]}>Activate Subscription</Text>
              </TouchableOpacity>
              
              {/* Walkthrough Button */}
              <TouchableOpacity 
                style={[styles.button, {width: '80%', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#6a12e4ff', marginTop: 12}]}
                onPress={() => setShowWalkthrough(true)}
              >
                <Text style={[styles.buttonText, {color: '#6a12e4ff'}]}>Replay App Walkthrough</Text>
              </TouchableOpacity>

            {/* Account */}
            <Text style={styles.subtext}>Account</Text>
            <View style={styles.input}>
              <Text style={styles.inputText}>Name</Text>
              <TextInput
                style={styles.inputBorder}
                placeholder={`${user?.name}`}
                placeholderTextColor="#a8a8a8ff"
                value={name}
                onChangeText={setName}
                onSubmitEditing={() => handleNameChange(name)}
              />
          </View>
          <View style={styles.input}>
            <Text style={styles.inputText}>Email</Text>
              <TextInput
                style={styles.inputBorder}
                placeholder={`${user?.email}`}
                placeholderTextColor={'#a8a8a8ff'}
                value={email}
                onPress={ () => {
                  if (!user) {
                    Alert.alert("Email change not allowed", "You cannot change your email because you are logged in with a social account.")
                    return
                  }
                }}
                onChangeText={setEmail}
                onSubmitEditing={() => handleEmailChange(email)}
              />
              </View>
                  {/* Change Password */}
                  <TouchableOpacity style={styles.input} onPress={ () => {
                    if (!user) {
                      Alert.alert("Password change not allowed", "You cannot change your password because you are logged in with a social account.")
                      return
                    }
                    else {
                      setShowChangePassword(true)
                    }
                  }}>
                    <Text style={styles.inputText}>Password</Text>
                    <View style={styles.inputBorder}>
                    <Text style={{position: 'absolute', right: '10%', top: '35%', color: '#8a8989ff', fontSize: 20}}>************</Text>
                    </View>
                  </TouchableOpacity>
                  <Modal
                    visible={showChangePassword}
                    animationType="slide"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={() => setShowChangePassword(false)}
                  >
                    <View style={popupStyles.container}>
                      <View style={popupStyles.screen}>
                        {/* Cancel (X) Button */}
                        <TouchableOpacity
                          onPress={() => setShowChangePassword(false)}
                          style={{
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            zIndex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>

                        {/* Actual content */}
                        <ChangePassword onClose={() => setShowChangePassword(false)} />
                      </View>
                    </View>
                  </Modal>
                  
                  <Modal
                    visible={showNotificationPreferences}
                    animationType="slide"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={() => setShowNotificationPreferences(false)}
                  >
                    <View style={popupStyles.container}>
                      <View style={popupStyles.screen}>
                        {/* Cancel (X) Button */}
                        <TouchableOpacity
                          onPress={() => setShowNotificationPreferences(false)}
                          style={{
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            zIndex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>

                        {/* Actual content */}
                        <NotificationPreferences onClose={() => setShowNotificationPreferences(false)} />
                      </View>
                    </View>
                  </Modal>

                  {/* Currency Picker Modal */}
                  <Modal
                    visible={showCurrencyPicker}
                    animationType="slide"
                    transparent={true}
                    statusBarTranslucent={true}
                    onRequestClose={() => setShowCurrencyPicker(false)}
                  >
                    <View style={popupStyles.container}>
                      <View style={popupStyles.screen}>
                        {/* Cancel (X) Button */}
                        <TouchableOpacity
                          onPress={() => setShowCurrencyPicker(false)}
                          style={{
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            zIndex: 1,
                          }}
                        >
                          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>

                        {/* Currency Selection Content */}
                        <View style={styles.currencyContainer}>
                          <Text style={styles.currencyTitle}>Select Currency</Text>
                          
                          <TouchableOpacity 
                            style={[
                              styles.currencyOption,
                              selectedCurrency === 'CAD' && styles.selectedCurrencyOption
                            ]}
                            onPress={() => selectCurrency('CAD')}
                          >
                            <View style={styles.currencyInfo}>
                              <Text style={[
                                styles.currencyCode,
                                selectedCurrency === 'CAD' && styles.selectedCurrencyText
                              ]}>CAD</Text>
                              <Text style={[
                                styles.currencyName,
                                selectedCurrency === 'CAD' && styles.selectedCurrencyText
                              ]}>Canadian Dollar</Text>
                            </View>
                            {selectedCurrency === 'CAD' && (
                              <MaterialCommunityIcons 
                                name="check-circle" 
                                size={24} 
                                color="#6a12e4ff" 
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={[
                              styles.currencyOption,
                              selectedCurrency === 'USD' && styles.selectedCurrencyOption
                            ]}
                            onPress={() => selectCurrency('USD')}
                          >
                            <View style={styles.currencyInfo}>
                              <Text style={[
                                styles.currencyCode,
                                selectedCurrency === 'USD' && styles.selectedCurrencyText
                              ]}>USD</Text>
                              <Text style={[
                                styles.currencyName,
                                selectedCurrency === 'USD' && styles.selectedCurrencyText
                              ]}>US Dollar</Text>
                            </View>
                            {selectedCurrency === 'USD' && (
                              <MaterialCommunityIcons 
                                name="check-circle" 
                                size={24} 
                                color="#6a12e4ff" 
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
                  
                {/* Currency Picker */}
              <TouchableOpacity style={styles.input} onPress={HandleCurrencyChange}>
                <Text style={styles.inputText}>Currency</Text>
                <View style={styles.inputBorder}>
                  <Text style={{position: 'absolute', right: '10%', top: '28%', color: '#8a8989ff', fontSize: 20}}>{userCurrency}</Text>
                </View>
              </TouchableOpacity>

              {/* Features
              <Text style={styles.subtext}>Features</Text>
              <View style={styles.toggleBorder}>
                <MaterialCommunityIcons name="face-recognition" size={24} color="#355affff" style={{paddingLeft: 15, paddingRight: 10,}} />
                <Text style={[styles.buttonText, {paddingRight: 112, color: '#0f68ddff'}]}>Enable Face ID</Text>
                <Switch value={isEnabled} onValueChange={toggleSwitch} />
              </View> */}
              {/* Preferences */}
              <Text style={styles.subtext}>Preferences</Text>
              <TouchableOpacity style={styles.button} onPress={HandleChangeNotis}>
                <Text style={styles.buttonText}>Change Notification Preferences</Text>
              </TouchableOpacity>
              {/* Legal */}
              <Text style={styles.subtext}>Legal</Text>
              <TouchableOpacity style={styles.button} onPress={HandleAbout}>
                <Text style={styles.buttonText}>About</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={HandleTOS}>
                <Text style={styles.buttonText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={HandlePrivacyPolicy}>
                <Text style={styles.buttonText}>Privacy Policy</Text>
              </TouchableOpacity>
              {/* Support */}
              <Text style={styles.subtext}>Support</Text>
              <TouchableOpacity style={styles.button} onPress={HandleContactSupport}>
                <Text style={styles.buttonText}>Contact Support</Text>
              </TouchableOpacity>
              {/* Account Management */}
              <Text style={styles.subtext}>Account Management</Text>
              <TouchableOpacity style={styles.button} onPress={HandleLogout}>
                <Text style={[styles.buttonText, {color: '#e91717ff'}]}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor: '#d32020ff'}]} onPress={HandleDeleteAccount}>
                <Text style={[styles.buttonText, {color: 'white'}]}>Delete Account</Text>
              </TouchableOpacity>
                
        </View>
        </ScrollView>

        {/* Walkthrough Modal */}
        {showWalkthrough && (
          <Modal
            visible={showWalkthrough}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <WalkthroughScreen 
              isRewatch={true}
              onComplete={() => {
                setShowWalkthrough(false);
                // Reload currency after walkthrough completion
                const loadUserCurrency = async () => {
                  try {
                    const response = await plaidService.getUserProgress();
                    if (response.progress) {
                      const currency = response.progress.currency || 'USD';
                      setUserCurrency(currency);
                      setSelectedCurrency(currency);
                    }
                  } catch (error) {
                    console.error('Error reloading currency:', error);
                  }
                };
                loadUserCurrency();
              }}
            />
          </Modal>
        )}
        </View>
    )
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingTop: 100,
        paddingBottom: 20,
        backgroundColor: 'white'
    },
    innerContainer: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
      fontSize: 40,
      fontWeight: '600',
      textAlign: 'center',
      color: 'black',
      marginBottom: 10,
    },
    subtext: {
        marginTop: 25,
        fontWeight: '500',
    },
    input: {
        flexDirection: 'row', 
        alignItems: 'center', 
        width: '90%', 
        marginTop: 15, 
        backgroundColor: '#dddbdbff', 
        borderRadius: 100
    },
    inputBorder: {
        flex: 3, 
        textAlign: 'right', 
        paddingRight: 18, 
        fontSize: 18, 
        fontWeight: '500', 
        height: 55, 
        backgroundColor: 'transparent' 
    },
    inputText: {
      flex: 1, 
      textAlign: 'left', 
      paddingLeft: 18, 
      fontSize: 18, 
      fontWeight: '500',
    },
    button: {
        borderRadius: 100,
        backgroundColor: '#dddbdbff',
        width: '90%',
        height: 55,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15
    },
    toggleBorder: {
        flexDirection: 'row',
        borderRadius: 100,
        backgroundColor: '#dddbdbff',
        width: '90%',
        height: 55,
        justifyContent: 'flex-start',
        alignItems: 'center',
        fontSize: 18,
        fontWeight: '500',
        marginTop: 15
    },
    logout: {
        color: 'blue'
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '500',
    },
    // Currency Picker Styles
    currencyContainer: {
        padding: 20,
        width: '100%',
        alignItems: 'center',
    },
    currencyTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 30,
        color: '#333',
        textAlign: 'center',
    },
    currencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 20,
        marginBottom: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCurrencyOption: {
        backgroundColor: '#f0f0ff',
        borderColor: '#6a12e4ff',
    },
    currencyInfo: {
        flex: 1,
    },
    currencyCode: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    currencyName: {
        fontSize: 14,
        color: '#666',
    },
    selectedCurrencyText: {
        color: '#6a12e4ff',
    },
})