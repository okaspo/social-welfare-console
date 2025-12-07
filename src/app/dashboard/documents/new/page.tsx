import MinutesForm from "@/components/documents/minutes-form"

export default function NewDocumentPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">議事録の作成</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        理事会または評議員会の議事録を作成します。
                    </p>
                </div>
            </div>

            <MinutesForm />
        </div>
    )
}
