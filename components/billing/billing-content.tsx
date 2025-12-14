'use client';

import { useState } from 'react';
import { PlanPrice } from '@/lib/types';
import { changePlan } from '@/app/actions/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface BillingContentProps {
    prices: PlanPrice[];
    orgId: string; // Current Org ID
    currentPriceId?: string; // Current subscription
}

export function BillingContent({ prices, orgId, currentPriceId }: BillingContentProps) {
    const [isYearly, setIsYearly] = useState(false);
    const [isLoading, setIsLoading] = useState<string | null>(null); // priceId being selected
    const router = useRouter();

    const filteredPrices = prices.filter(p => p.interval === (isYearly ? 'year' : 'month'));

    // Sort: Free -> Standard -> Pro -> Ent
    // We can use amount to sort roughly.
    const sortedPrices = [...filteredPrices].sort((a, b) => a.amount - b.amount);

    const handleSubscribe = async (priceId: string) => {
        if (confirm('Are you sure you want to change your plan?')) {
            setIsLoading(priceId);
            try {
                await changePlan(orgId, priceId);
                router.refresh();
            } catch (error) {
                alert('Failed to change plan.');
                console.error(error);
            } finally {
                setIsLoading(null);
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* Interval Toggle */}
            <div className="flex justify-center items-center space-x-4">
                <Label className={!isYearly ? "font-bold" : ""}>Monthly</Label>
                <Switch
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                />
                <Label className={isYearly ? "font-bold" : ""}>
                    Yearly <span className="text-green-600 text-xs ml-1">(Save 20%)</span>
                </Label>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedPrices.map((price) => {
                    const isCurrent = price.id === currentPriceId;
                    const isSpecial = !price.is_public && price.campaign_code;

                    return (
                        <Card key={price.id} className={`flex flex-col ${isCurrent ? 'border-primary ring-1 ring-primary' : ''} ${isSpecial ? 'border-amber-400 bg-amber-50/30' : ''}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="uppercase text-lg">{price.plan_id}</CardTitle>
                                    {isSpecial && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Special Offer</Badge>}
                                </div>
                                <CardDescription>
                                    <span className="text-3xl font-bold">
                                        ¥{price.amount.toLocaleString()}
                                    </span>
                                    <span className="text-slate-500"> / {price.interval}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                                    {/* Placeholder features based on plan_id */}
                                    {price.plan_id === 'free' && <li>Basic Chat</li>}
                                    {price.plan_id === 'standard' && <li>Doc Generation</li>}
                                    {price.plan_id === 'pro' && <li>Advanced AI & Analytics</li>}
                                    {price.plan_id === 'enterprise' && <li>Dedicated Support</li>}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={isCurrent ? "outline" : (isSpecial ? "default" : "default")}
                                    disabled={isCurrent || !!isLoading}
                                    onClick={() => handleSubscribe(price.id)}
                                >
                                    {isCurrent ? 'Current Plan' : (isLoading === price.id ? 'Updating...' : 'Choose Plan')}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {filteredPrices.length === 0 && (
                <div className="text-center text-slate-500 py-10">
                    No plans available for this interval.
                </div>
            )}
        </div>
    );
}
