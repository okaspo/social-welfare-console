"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Officer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { OfficerForm } from "@/components/officers/officer-form";

// Mock Data
const MOCK_OFFICERS: Officer[] = [
    { id: '1', name: '山田 太郎 (Yamada Taro)', role: 'director', term_start: '2024-04-01', term_end: '2026-03-31', is_active: true, created_at: '2024-04-01' },
    { id: '2', name: '鈴木 花子 (Suzuki Hanako)', role: 'auditor', term_start: '2024-04-01', term_end: '2028-03-31', is_active: true, created_at: '2024-04-01' },
    { id: '3', name: '佐藤 一郎 (Sato Ichiro)', role: 'councilor', term_start: '2024-04-01', term_end: '2028-03-31', is_active: true, created_at: '2024-04-01' },
];

export default function OfficersPage() {
    const [officers, setOfficers] = useState<Officer[]>(MOCK_OFFICERS);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | undefined>(undefined);

    const handleAddSubmit = (data: Omit<Officer, "id" | "created_at" | "updated_at">) => {
        const newOfficer: Officer = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
        };
        setOfficers([...officers, newOfficer]);
        setIsAddOpen(false);
    };

    const handleEditSubmit = (data: Omit<Officer, "id" | "created_at" | "updated_at">) => {
        if (selectedOfficer) {
            const updated = officers.map(off => off.id === selectedOfficer.id ? { ...off, ...data } : off);
            setOfficers(updated);
            setSelectedOfficer(undefined);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'director': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">理事</Badge>;
            case 'auditor': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">監事</Badge>;
            case 'councilor': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">評議員</Badge>;
            default: return <Badge>{role}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">役員管理</h2>
                    <p className="text-gray-600 mt-1">理事、監事、評議員の管理</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> 役員を追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>新しい役員を追加</DialogTitle>
                        </DialogHeader>
                        <OfficerForm
                            onSubmit={handleAddSubmit}
                            onCancel={() => setIsAddOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="font-semibold text-gray-700">氏名</TableHead>
                            <TableHead className="font-semibold text-gray-700">役職</TableHead>
                            <TableHead className="font-semibold text-gray-700">任期開始</TableHead>
                            <TableHead className="font-semibold text-gray-700">任期終了</TableHead>
                            <TableHead className="font-semibold text-gray-700">ステータス</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {officers.map((officer) => (
                            <TableRow key={officer.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">{officer.name}</TableCell>
                                <TableCell>{getRoleBadge(officer.role)}</TableCell>
                                <TableCell className="text-gray-600">{officer.term_start}</TableCell>
                                <TableCell className="text-gray-600">{officer.term_end}</TableCell>
                                <TableCell>
                                    {officer.is_active ?
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">在任中</Badge>
                                        : <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">退任</Badge>
                                    }
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedOfficer(officer)} className="text-gray-600 hover:text-gray-900">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedOfficer} onOpenChange={(open) => !open && setSelectedOfficer(undefined)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>役員情報の編集</DialogTitle>
                    </DialogHeader>
                    {selectedOfficer && (
                        <OfficerForm
                            initialData={selectedOfficer}
                            onSubmit={handleEditSubmit}
                            onCancel={() => setSelectedOfficer(undefined)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

