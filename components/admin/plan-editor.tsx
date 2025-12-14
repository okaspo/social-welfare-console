'use client';

import { useState } from 'react';
import { PlanLimit, PlanFeatures, PlanType } from '@/lib/types';
import { updatePlan } from '@/app/actions/plans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface PlanEditorProps {
    plan: PlanLimit;
    allPlans: PlanLimit[]; // Needed for Sync Logic
    isOpen: boolean;
    onClose: () => void;
}

export function PlanEditor({ plan, allPlans, isOpen, onClose }: PlanEditorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<PlanLimit>({ ...plan });
    const [features, setFeatures] = useState<PlanFeatures>({ ...plan.features });
    const router = useRouter();

    // New Feature State
    const [newFeatureKey, setNewFeatureKey] = useState('');
    const [newFeatureType, setNewFeatureType] = useState<'boolean' | 'number' | 'string'>('boolean');
    const [newFeatureValue, setNewFeatureValue] = useState<string>('false');
    const [syncToAll, setSyncToAll] = useState(true);

    const handleQuotaChange = (field: keyof PlanLimit, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFeatureChange = (key: string, value: any) => {
        setFeatures(prev => ({ ...prev, [key]: value }));
    };

    const handleAddFeature = () => {
        if (!newFeatureKey) return;

        // Parse value based on type
        let val: any = newFeatureValue;
        if (newFeatureType === 'boolean') val = newFeatureValue === 'true';
        if (newFeatureType === 'number') val = Number(newFeatureValue);

        setFeatures(prev => ({ ...prev, [newFeatureKey]: val }));

        // Reset
        setNewFeatureKey('');
        setNewFeatureValue('false');
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Update Current Plan
            const updatedPlan = { ...formData, features };
            await updatePlan(plan.plan_id, updatedPlan);

            // 2. Sync Logic (if key was added and sync is ON)
            // Note: This logic implies we detect NEW keys. 
            // For simplicity in this turn, if 'syncToAll' is true, we iterate through ALL features in the current editor 
            // and ensure other plans have them (defaulting to current value or false/0).
            // A better way is to track *added* keys. But checking all is safer for consistency.

            if (syncToAll) {
                // Find keys in current features that might be missing in others
                const keys = Object.keys(features);

                for (const p of allPlans) {
                    if (p.plan_id === plan.plan_id) continue; // Skip current

                    const pFeatures = { ...p.features };
                    let changed = false;

                    for (const key of keys) {
                        if (pFeatures[key] === undefined) {
                            // Missing key! Add it.
                            // Default value: false for boolean, 0 for number, "" for string?
                            // Or use the value we just set? "Add to all plans" usually implies adding the flag available but maybe disabled.
                            // The user prompt said: "(value is False/0/empty)"
                            const type = typeof features[key];
                            if (type === 'boolean') pFeatures[key] = false;
                            else if (type === 'number') pFeatures[key] = 0;
                            else pFeatures[key] = '';

                            changed = true;
                        }
                    }

                    if (changed) {
                        await updatePlan(p.plan_id, { features: pFeatures });
                    }
                }
            }

            onClose();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update plan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Plan: {plan.plan_id.toUpperCase()}</DialogTitle>
                    <DialogDescription>
                        Manage limits and capabilities for this tier.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Quotas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quotas</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monthly Chat Limits (-1 = Unlimited)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        value={formData.monthly_chat_limit}
                                        onChange={(e) => handleQuotaChange('monthly_chat_limit', Number(e.target.value))}
                                    />
                                    {formData.monthly_chat_limit === -1 && <span className="text-xs font-bold text-green-600">UNLIMITED</span>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Doc Generation Limit</Label>
                                <Input
                                    type="number"
                                    value={formData.monthly_doc_gen_limit}
                                    onChange={(e) => handleQuotaChange('monthly_doc_gen_limit', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Storage (MB)</Label>
                                <Input
                                    type="number"
                                    value={formData.storage_limit_mb}
                                    onChange={(e) => handleQuotaChange('storage_limit_mb', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Users</Label>
                                <Input
                                    type="number"
                                    value={formData.max_users}
                                    onChange={(e) => handleQuotaChange('max_users', Number(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dynamic Feature Flags */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Feature Flags (JSONB)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(features).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between border-b pb-2">
                                    <Label className="font-mono">{key}</Label>
                                    <div className="w-[150px]">
                                        {typeof value === 'boolean' ? (
                                            <Switch
                                                checked={value}
                                                onCheckedChange={(c) => handleFeatureChange(key, c)}
                                            />
                                        ) : typeof value === 'number' ? (
                                            <Input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleFeatureChange(key, Number(e.target.value))}
                                            />
                                        ) : (
                                            <Input
                                                value={String(value || '')}
                                                onChange={(e) => handleFeatureChange(key, e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add New Feature */}
                            <div className="bg-slate-50 p-4 rounded-md border space-y-3 mt-4">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Add New Flag</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        placeholder="Key (e.g. can_use_beta)"
                                        value={newFeatureKey}
                                        onChange={(e) => setNewFeatureKey(e.target.value)}
                                    />
                                    <Select
                                        value={newFeatureType}
                                        onValueChange={(v: any) => setNewFeatureType(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="string">String</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {newFeatureType === 'boolean' ? (
                                        <Select
                                            value={newFeatureValue}
                                            onValueChange={setNewFeatureValue}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">True</SelectItem>
                                                <SelectItem value="false">False</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            placeholder="Value"
                                            value={newFeatureValue}
                                            onChange={(e) => setNewFeatureValue(e.target.value)}
                                        />
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch checked={syncToAll} onCheckedChange={setSyncToAll} id="sync-mode" />
                                    <Label htmlFor="sync-mode">Add to ALL plans (Default: False/0/Empty)</Label>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleAddFeature}
                                    disabled={!newFeatureKey}
                                >
                                    + Add Flag
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
