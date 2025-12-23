import { Coffee } from 'lucide-react';

export default function BreakRoomPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 text-center space-y-6">
            <div className="flex justify-center">
                <div className="bg-orange-50 p-6 rounded-full">
                    <Coffee className="h-16 w-16 text-orange-400" />
                </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">休憩室</h1>
            <p className="text-gray-500 max-w-lg mx-auto">
                ここは少し息抜きをするための場所です。<br />
                葵さんの4コマ漫画や、季節の雑談などが更新される予定です。
            </p>
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                Coming Soon...
            </div>
        </div>
    );
}
