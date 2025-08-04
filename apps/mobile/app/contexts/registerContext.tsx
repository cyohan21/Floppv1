import React, { createContext, useState, useContext } from 'react'

const RegisterContext = createContext<registerContextType | undefined>(undefined);

export type registerDataType = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;

}

export type registerContextType = {
    registerData: registerDataType;
    setRegisterData: React.Dispatch<React.SetStateAction<registerDataType>>;
}

export const useRegister = () => {
    const context = useContext(RegisterContext)
    if (!context) {
        throw new Error('useRegister must be wrapped within AuthProvider.')
    }
    return context
}

export const RegisterProvider = ({children}: {children: React.ReactNode} ) => {
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    return (
        <RegisterContext.Provider value={{ registerData, setRegisterData }}>
            {children}
        </RegisterContext.Provider>
    )
}