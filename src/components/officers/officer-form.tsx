'use client'

import { useState } from 'react'
import { Officer, OfficerRole, getRoleLabel, getTermLimitYears } from '@/lib/officers/data'
import { X, Calendar, Users, Mail, MapPin, Briefcase, DollarSign } from 'lucide-react'

interface OfficerFormProps {
    officer?: Officer | null
    onClose: () => void
    onSave: (officer: Partial<Officer>) => void
}

export default function OfficerForm({ officer, onClose, onSave }: OfficerFormProps) {
    const [formData, setFormData] = useState({
        name: officer?.name || '',
        role: officer?.role || 'director' as OfficerRole,
        termStartDate: officer?.termStartDate || '',
        termEndDate: officer?.termEndDate || '',
        email: officer?.email || '',
        address: officer?.address || '',
        dateOfBirth: officer?.dateOfBirth || '',
        occupation: officer?.occupation || '',
        isRemunerated: officer?.isRemunerated || false
    })

    // Calculate age from date of birth
    const calculateAge = (dob: string): number | null => {
        if (!dob) return null
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const age = calculateAge(formData.dateOfBirth)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
    }

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {officer ? '役員情報編集' : '役員情報登録'}
                            </h2>
                            <p className="text-sm text-gray-600">
                                役員名簿・現況報告書作成に必要な情報を入力してください
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">基本情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        氏名 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="例: 福祉 太郎"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        役職 <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="director">{getRoleLabel('director')}</option>
                                        <option value="auditor">{getRoleLabel('auditor')}</option>
                                        <option value="councilor">{getRoleLabel('councilor')}</option>
                                        <option value="selection_committee">{getRoleLabel('selection_committee')}</option>
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        任期規定: {getTermLimitYears(formData.role)}年
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="inline h-4 w-4 mr-1" />
                                        メールアドレス
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="example@fukushi.or.jp"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        招集通知の送信に使用
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Term Dates */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                任期情報
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        任期開始日 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.termStartDate}
                                        onChange={(e) => handleInputChange('termStartDate', e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        任期満了日 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.termEndDate}
                                        onChange={(e) => handleInputChange('termEndDate', e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personal Information (PII) */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-2 mb-4">
                                <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">!</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-amber-900">個人情報（役員名簿・現況報告書用）</h3>
                                    <p className="text-xs text-amber-700 mt-1">
                                        行政への届出書類作成に必要な情報です。厳重に管理されます。
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        生年月日
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        {age !== null && (
                                            <div className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700">
                                                <span className="font-medium">{age}歳</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        欠格事由（未成年等）の確認に使用
                                    </p>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="inline h-4 w-4 mr-1" />
                                        住所
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="〒123-4567 東京都○○区○○町1-2-3"
                                    />
                                </div>

                                {/* Occupation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Briefcase className="inline h-4 w-4 mr-1" />
                                        職業
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.occupation}
                                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="例: 自営業、公務員、会社員"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        現況報告書に記載
                                    </p>
                                </div>

                                {/* Remuneration */}
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                役員報酬の支給あり
                                            </label>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                社会福祉法人の報酬基準に基づく管理
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isRemunerated}
                                            onChange={(e) => handleInputChange('isRemunerated', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        保存する
                    </button>
                </div>
            </div>
        </div>
    )
}
