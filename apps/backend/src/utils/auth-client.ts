import { createAuthClient } from "better-auth/client"
import { usernameClient, emailOTPClient } from "better-auth/client/plugins"

 
export const authClient = createAuthClient({
    plugins: [ 
        usernameClient(),
        emailOTPClient() 
    ] 
})