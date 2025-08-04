import React, { createContext, useContext, useState } from 'react'


export type VerifyContextType = {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
}

const VerifyContext = createContext<VerifyContextType | undefined>(undefined);

export function VerifyProvider({children}: {children: React.ReactNode}) {
    const [email, setEmail] = useState('')
    const [password, setPassword ] = useState('')

    return (
    <VerifyContext.Provider value={{email, setEmail, password, setPassword}}>
        {children}
    </VerifyContext.Provider>
)

}

export const useVerify = () => {
    const context = useContext(VerifyContext);
    if (!context) {
        throw new Error('useVerify must be used within a VerifyProvider');
    }
    return context;
};