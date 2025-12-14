import { getPlans } from '@/app/actions/plans';
import { PlanList } from '@/components/admin/plan-list';

export default async function AdminPlansPage() {
    const plans = await getPlans();

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
            </div>

            <PlanList plans={plans} />
        </div>
    );
}
