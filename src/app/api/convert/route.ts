// Stub route to satisfy TypeScript imports after switching to Python conversion.
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // This route is intentionally left as a placeholder.
    // The actual conversion logic is handled by the Python function at /api/convert.
    return NextResponse.json({ message: 'Conversion endpoint is handled by Python runtime.' });
}
