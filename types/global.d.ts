interface Window {
    google?: {
        accounts: {
            id: {
                initialize: (config: object) => void
                prompt: () => void
                cancel: () => void
            }
        }
    }
}