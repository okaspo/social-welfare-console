import OfficerList from "@/components/officers/officer-list"

export default function OfficersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">役員・評議員 管理</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        理事、監事、評議員の任期管理を行います。
                    </p>
                </div>
            </div>

            <OfficerList />
        </div>
    )
}
