'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import OfficerForm from "./officer-form"

export default function NewOfficerDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors">
                    <Plus className="h-4 w-4" />
                    新規登録
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>役員 新規登録</DialogTitle>
                </DialogHeader>
                <OfficerForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
