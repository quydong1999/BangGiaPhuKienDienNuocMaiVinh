export default function Loading() {
    return (
        <div className="min-h-screen bg-light-grey flex flex-col">
            {/* Giả lập giao diện Header và Breadcrumb để tránh giật trang */}
            <div className="h-16 bg-white animate-pulse mb-4" />
            <div className="max-w-6xl mx-auto w-full px-4">
                <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}