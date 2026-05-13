import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Google({
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly",
                },
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },

    callbacks: {
        async signIn({ user }) {
            const adminEmails = process.env.ADMIN_EMAILS
                ?.split(",")
                .map((e) => e.trim()) ?? []
            return adminEmails.includes(user.email ?? "")
        },

        async jwt({ token, account }) {
            // Lần đăng nhập đầu tiên: lưu access_token + refresh_token
            if (account) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at! * 1000, // chuyển sang ms
                }
            }

            // Token chưa hết hạn => trả về nguyên
            if (Date.now() < (token.expiresAt as number)) {
                return token
            }

            // Token hết hạn => tự động refresh
            try {
                const res = await fetch("https://oauth2.googleapis.com/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        client_id: process.env.AUTH_GOOGLE_ID!,
                        client_secret: process.env.AUTH_GOOGLE_SECRET!,
                        grant_type: "refresh_token",
                        refresh_token: token.refreshToken as string,
                    }),
                })

                const data = await res.json()

                if (!res.ok) throw data

                return {
                    ...token,
                    accessToken: data.access_token,
                    expiresAt: Date.now() + data.expires_in * 1000,
                    // Google có thể trả refresh_token mới, nếu có thì cập nhật
                    refreshToken: data.refresh_token ?? token.refreshToken,
                }
            } catch (error) {
                console.error("❌ Lỗi refresh token:", error)
                return { ...token, error: "RefreshTokenError" }
            }
        },

        async session({ session, token }) {
            session.user.isAdmin = true
            session.accessToken = token.accessToken as string
            session.error = token.error as string | undefined
            return session
        },
    },

    pages: {
        error: '/auth/error',
    }
})