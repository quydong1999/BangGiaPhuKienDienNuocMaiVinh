import { useSession } from "next-auth/react"

export function useAdmin() {
    const { data: session, status } = useSession()
    return {
        isAdmin: session?.user?.isAdmin ?? false,
        isLoading: status === "loading",
        user: session?.user,
    }
}