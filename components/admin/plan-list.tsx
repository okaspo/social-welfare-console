'use client';

import { PlanLimit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { PlanEditor } from './plan-editor';

export function PlanList({ plans }: { plans: PlanLimit[] }) {
    const [editingPlan, setEditingPlan] = useState<PlanLimit | null>(null);

    return (
        <div className="space-y-4">
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan ID</TableHead>
                            <TableHead>Chat Limit</TableHead>
                            <TableHead>Doc Limit</TableHead>
                            <TableHead>Storage</TableHead>
                            <TableHead>Features (Count)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.plan_id}>
                                <TableCell className="font-medium uppercase">{plan.plan_id}</TableCell>
                                <TableCell>
                                    {plan.monthly_chat_limit === -1 ? 'Unlimited' : plan.monthly_chat_limit}
                                </TableCell>
                                <TableCell>{plan.monthly_doc_gen_limit}</TableCell>
                                <TableCell>{plan.storage_limit_mb} MB</TableCell>
                                <TableCell>{Object.keys(plan.features).length} flags</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingPlan(plan)}
                                    >
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {editingPlan && (
                <PlanEditor
                    plan={editingPlan}
                    allPlans={plans}
                    isOpen={!!editingPlan}
                    onClose={() => setEditingPlan(null)}
                />
            )}
        </div>
    );
}
