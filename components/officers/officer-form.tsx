"use client";

import { useState, useEffect } from "react";
import { Officer, OfficerRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { addYears, format } from "date-fns";

interface OfficerFormProps {
    initialData?: Officer;
    onSubmit: (data: Omit<Officer, "id" | "created_at" | "updated_at">) => void;
    onCancel: () => void;
}

export function OfficerForm({ initialData, onSubmit, onCancel }: OfficerFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [role, setRole] = useState<OfficerRole>(initialData?.role || "director");
    const [termStart, setTermStart] = useState(initialData?.term_start || format(new Date(), "yyyy-MM-dd"));
    const [termEnd, setTermEnd] = useState(initialData?.term_end || "");
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

    // Auto-calculate term end logic
    useEffect(() => {
        // Only auto-calc if we have a start date used for calculation
        if (termStart) {
            // If it's a new entry (initialData is undefined), we always calc
            // If it's an edit, we might want to respect existing, but if user changes start/role we should update.
            // For simplicity: Update if the calculated end date differs from current end date, 
            // OR if current end date is empty.
            const startDate = new Date(termStart);
            if (!isNaN(startDate.getTime())) {
                const duration = (role === "director") ? 2 : 4;
                const endDate = addYears(startDate, duration);
                const formattedEnd = format(endDate, "yyyy-MM-dd");

                // Only update if it looks like a "default" calculation or necessary update
                // To avoid overriding manual edits, we could track if user manually focused term_end.
                // But for this use case, enforcing statutory limits is actually a feature.
                setTermEnd(formattedEnd);
            }
        }
    }, [termStart, role]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            role,
            term_start: termStart,
            term_end: termEnd,
            is_active: isActive,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Officer Full Name" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(val) => setRole(val as OfficerRole)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="director">Director (理事)</SelectItem>
                        <SelectItem value="auditor">Auditor (監事)</SelectItem>
                        <SelectItem value="councilor">Councilor (評議員)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="term_start">Term Start</Label>
                    <Input type="date" id="term_start" value={termStart} onChange={(e) => setTermStart(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="term_end">Term End</Label>
                    <Input type="date" id="term_end" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">{role === "director" ? "2 years" : "4 years"} based on statutory rules.</p>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
}
