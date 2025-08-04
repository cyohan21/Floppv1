import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type UserType = {
  id: string;
  name: string;
  email: string;
};

export type AuthContextType = {
    login: (token: string, user: UserType) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    user: UserType | null;
    onLoginSuccess?: () => void;
}

export function AuthProvider({children, onLoginSuccess}: {children: React.ReactNode, onLoginSuccess?: () => void}) {
//                           ↑ Destructure children from the props object
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<UserType | null>(null)

    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {

            await new Promise(resolve => setTimeout(resolve, 100))
            
            const token = await AsyncStorage.getItem('authToken')
            setIsAuthenticated(!!token)
            console.log("Token: ", token)

            const userInfo = await AsyncStorage.getItem('userInfo');
            setUser(userInfo ? JSON.parse(userInfo) : null);
        }
        catch (err) {
            setIsAuthenticated(false);
        }
        finally {
            setLoading(false);
        }
    }

    const login = async (token: string, user: UserType) => {
        await AsyncStorage.setItem('authToken', token)
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        setIsAuthenticated(true)
        setUser(user)
        console.log(user)
        console.log("isAuthenticated set to true")
        
        // Trigger bank status check after successful login
        if (onLoginSuccess) {
            onLoginSuccess();
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('authToken')
        setIsAuthenticated(false)
        setUser(null)
        console.log("isAuthenticated set to false")
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, user}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    // Initializing the Context allows for AuthContext.Provider to search for any of its object variables inside.
    if (!context) {
        throw new Error('useAuth must be wrapped within AuthProvider.')
    }
    return context // To see what context outputs.
}