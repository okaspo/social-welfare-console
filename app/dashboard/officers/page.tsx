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
            case 'director': return <Badge className="bg-blue-600 hover:bg-blue-700">Director</Badge>;
            case 'auditor': return <Badge className="bg-purple-600 hover:bg-purple-700">Auditor</Badge>;
            case 'councilor': return <Badge variant="outline" className="border-green-600 text-green-600">Councilor</Badge>;
            default: return <Badge>{role}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Officer Management</h2>
                    <p className="text-muted-foreground">Manage directors, auditors, and councilors.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Officer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Officer</DialogTitle>
                        </DialogHeader>
                        <OfficerForm
                            onSubmit={handleAddSubmit}
                            onCancel={() => setIsAddOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Term Start</TableHead>
                            <TableHead>Term End</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {officers.map((officer) => (
                            <TableRow key={officer.id}>
                                <TableCell className="font-medium">{officer.name}</TableCell>
                                <TableCell>{getRoleBadge(officer.role)}</TableCell>
                                <TableCell>{officer.term_start}</TableCell>
                                <TableCell>{officer.term_end}</TableCell>
                                <TableCell>
                                    {officer.is_active ?
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                                        : <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-100">Inactive</Badge>
                                    }
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedOfficer(officer)}>
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
                        <DialogTitle>Edit Officer</DialogTitle>
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
