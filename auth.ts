import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { jwtDecode } from "jwt-decode"

interface GoogleOneTapCredential {
    email: string
    name: string
    picture: string
    sub: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        // OAuth thông thường (LoginModal)
        Google({
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),

        // One Tap dùng credential JWT riêng
        Credentials({
            id: "google-one-tap",
            name: "Google One Tap",
            credentials: {
                credential: { type: "text" },
            },
            async authorize(credentials) {
                const token = credentials?.credential as string
                if (!token) return null

                // Decode JWT từ Google để lấy thông tin user
                const decoded = jwtDecode<GoogleOneTapCredential>(token)

                const adminEmails = process.env.ADMIN_EMAILS
                    ?.split(",")
                    .map((e) => e.trim()) ?? []

                // Chỉ cho phép email trong danh sách
                if (!adminEmails.includes(decoded.email)) return null

                return {
                    id: decoded.sub,
                    email: decoded.email,
                    name: decoded.name,
                    image: decoded.picture,
                }
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },

    cookies: {
        sessionToken: {
            options: {
                maxAge: 7 * 24 * 60 * 60,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            },
        },
    },

    callbacks: {
        async signIn({ user, account }) {
            // Credentials (One Tap) đã check trong authorize() rồi, cho qua
            if (account?.provider === "google-one-tap") return true

            // OAuth thông thường thì check ở đây
            const adminEmails = process.env.ADMIN_EMAILS
                ?.split(",")
                .map((e) => e.trim()) ?? []
            return adminEmails.includes(user.email ?? "")
        },
        async session({ session }) {
            session.user.isAdmin = true
            return session
        },
    },

    pages: {
        error: '/auth/error',
    }
})