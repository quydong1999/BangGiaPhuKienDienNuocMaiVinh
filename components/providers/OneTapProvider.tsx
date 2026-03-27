"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Swal from "sweetalert2";

export default function OneTapProvider() {
    const { status } = useSession();

    useEffect(() => {
        // Kiểm tra lỗi từ Google Auth (người dùng không được cấp quyền)
        const authError = sessionStorage.getItem("auth_error");
        if (authError) {
            sessionStorage.removeItem("auth_error");
            Swal.fire({
                title: "Lỗi đăng nhập!",
                text: "Tài khoản của bạn chưa được cấp quyền truy cập.",
                icon: "error",
                confirmButtonColor: "#059669",
            });
        }

        if (status !== "unauthenticated") return;

        const google = (window as any).google;

        const loadScript = () => {
            if (google) return initializeOneTap();

            const script = document.createElement("script");
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = initializeOneTap;
            document.body.appendChild(script);
        };

        const initializeOneTap = () => {
            const google = (window as any).google;
            google?.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                use_fedcm_for_prompt: true, // 👈 Bật FedCM (theo chuẩn mới của Google)
                auto_select: false,         // 👈 Không tự động chọn tài khoản (để người dùng nhấn chọn)
                itp_support: true,          // 👈 Hỗ trợ ITP (phòng hờ)
                callback: async (response: any) => {
                    const result = await signIn("google-one-tap", {
                        credential: response.credential,
                        redirect: false,
                        callbackUrl: window.location.href,
                    });

                    if (result?.error) {
                        Swal.fire({
                            title: "Lỗi!",
                            text: "Tài khoản không có quyền truy cập.",
                            icon: "error",
                            confirmButtonColor: "#059669",
                        });
                    }
                },
                cancel_on_tap_outside: false,
                context: "signin",
            });

            // google?.accounts.id.prompt((notification: any) => {
            //     if (notification.isNotDisplayed()) {
            //         console.log("❌ One Tap not displayed:", notification.getNotDisplayedReason());
            //     } else if (notification.isSkippedMoment()) {
            //         console.log("⚠️ One Tap skipped:", notification.getSkippedReason());
            //     } else if (notification.isDismissedMoment()) {
            //         console.log("ℹ️ One Tap dismissed:", notification.getDismissedReason());
            //     }
            // });
        };

        loadScript();

        return () => {
            google?.accounts.id.cancel();
        };
    }, [status]);

    return null;
}