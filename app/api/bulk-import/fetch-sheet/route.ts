import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Trích xuất spreadsheetId từ các dạng URL Google Sheet:
 *   - https://docs.google.com/spreadsheets/d/{ID}/edit
 *   - https://docs.google.com/spreadsheets/d/{ID}/export
 *   - https://docs.google.com/spreadsheets/d/{ID}
 */
function extractSpreadsheetId(url: string): string | null {
    const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
        /^([a-zA-Z0-9_-]{20,})$/, // raw ID
    ]
    for (const regex of patterns) {
        const match = url.match(regex)
        if (match) return match[1]
    }
    return null
}

/**
 * Escape giá trị CSV: bọc dấu ngoặc kép nếu chứa dấu phẩy, xuống dòng, hoặc dấu ngoặc kép.
 */
function escapeCsvValue(val: string): string {
    if (val.includes(",") || val.includes("\n") || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`
    }
    return val
}

/**
 * Chuyển mảng 2D thành chuỗi CSV.
 */
function arrayToCsv(rows: string[][]): string {
    return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const session = await auth()

    if (!session?.accessToken) {
        return NextResponse.json(
            { success: false, message: "Không có quyền truy cập. Vui lòng đăng nhập lại." },
            { status: 401 }
        )
    }

    if (session.error === "RefreshTokenError") {
        return NextResponse.json(
            { success: false, message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
            { status: 401 }
        )
    }

    const body = await req.json()
    const { action, url, sheetName } = body as {
        action: "get_tabs" | "get_data"
        url: string
        sheetName?: string
    }

    if (!url) {
        return NextResponse.json(
            { success: false, message: "Thiếu URL Google Sheet." },
            { status: 400 }
        )
    }

    const spreadsheetId = extractSpreadsheetId(url)
    if (!spreadsheetId) {
        return NextResponse.json(
            { success: false, message: "URL Google Sheet không hợp lệ." },
            { status: 400 }
        )
    }

    const accessToken = session.accessToken

    try {
        // ─── Action: Lấy danh sách tab ───────────────────────────────────
        if (action === "get_tabs") {
            const res = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            )

            if (!res.ok) {
                const err = await res.json()
                const status = res.status

                if (status === 403 || status === 404) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "Không thể truy cập sheet này. Hãy chắc chắn rằng sheet đã được chia sẻ cho tài khoản của bạn.",
                        },
                        { status: 403 }
                    )
                }

                console.error("❌ Google Sheets API error:", err)
                return NextResponse.json(
                    { success: false, message: "Lỗi khi gọi Google Sheets API." },
                    { status: 500 }
                )
            }

            const data = await res.json()
            const title: string = data.properties?.title ?? "Không rõ tên"
            const tabs: string[] = data.sheets?.map(
                (s: { properties: { title: string } }) => s.properties.title
            ) ?? []

            return NextResponse.json({ success: true, tabs, title })
        }

        // ─── Action: Lấy dữ liệu tab ────────────────────────────────────
        if (action === "get_data") {
            if (!sheetName) {
                return NextResponse.json(
                    { success: false, message: "Chưa chọn tab." },
                    { status: 400 }
                )
            }

            const encodedSheet = encodeURIComponent(sheetName)
            const res = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheet}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            )

            if (!res.ok) {
                const err = await res.json()
                console.error("❌ Google Sheets API error:", err)
                return NextResponse.json(
                    { success: false, message: `Lỗi khi đọc tab "${sheetName}".` },
                    { status: 500 }
                )
            }

            const data = await res.json()
            const values: string[][] = data.values ?? []

            if (values.length < 2) {
                return NextResponse.json(
                    { success: false, message: "Sheet trống hoặc chỉ có header." },
                    { status: 400 }
                )
            }

            // Chuyển thành CSV string
            const csvText = arrayToCsv(values)

            return NextResponse.json({ success: true, csvText, totalRows: values.length - 1 })
        }

        return NextResponse.json(
            { success: false, message: "Action không hợp lệ." },
            { status: 400 }
        )
    } catch (error) {
        console.error("❌ fetch-sheet error:", error)
        return NextResponse.json(
            { success: false, message: "Lỗi server khi xử lý yêu cầu." },
            { status: 500 }
        )
    }
}
