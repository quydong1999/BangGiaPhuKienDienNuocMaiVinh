"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthErrorHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    useEffect(() => {
        if (error) {
            sessionStorage.setItem("auth_error", error);
        }
        router.replace("/");
    }, []);

    return null;
}

export default function AuthErrorPage() {
    return (
        <Suspense>
            <AuthErrorHandler />
        </Suspense>
    );
}