import MeetingForm from "@/components/swc/meetings/meeting-form"

export default function NewMeetingPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">新しい会議の招集</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        理事会または評議員会を開催するための手続きを開始します。
                    </p>
                </div>
            </div>

            <MeetingForm />
        </div>
    )
}
