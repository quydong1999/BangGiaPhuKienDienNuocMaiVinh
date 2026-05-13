import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            isAdmin?: boolean
        } & DefaultSession["user"]
        accessToken?: string
        error?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        accessToken?: string
        refreshToken?: string
        expiresAt?: number
        error?: string
    }
}