const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default function BusinessSchema() {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": "Điện nước Mai Vinh",
                    "image": `${baseUrl}/diennuocmaivinh.png`,
                    "telephone": "0982390943",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Đề Gi",
                        "addressRegion": "Bình Định",
                        "addressCountry": "VN"
                    },
                    "openingHours": "Mo-Su 00:00-23:59",
                    "priceRange": "$",
                    "url": `${baseUrl}`
                })
            }}
        />
    )
}