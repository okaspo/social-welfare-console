"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setIsLoading(false)
        } else {
            router.push("/dashboard")
            router.refresh()
        }
    }

    return (
        <div className="w-full h-screen grid lg:grid-cols-2">
            {/* Left Side: Branding & Aesthetics */}
            <div className="hidden lg:flex flex-col relative bg-muted text-white p-10">
                <div className="absolute inset-0 bg-primary"></div>
                <div className="relative z-10 font-bold text-2xl flex items-center gap-2">
                    GovAI Console
                </div>
                <div className="relative z-10 mt-auto">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-balance">
                        Next-Gen Governance for Social Welfare
                    </h1>
                    <p className="text-lg opacity-90 max-w-md">
                        Automate board meetings, compliance, and annual reporting with the power of AI.
                        Designed for board directors and facility managers.
                    </p>
                </div>
                {/* Decorative elements */}
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent opacity-20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
            </div>

            {/* Right Side: Logic */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="mx-auto w-full max-w-sm space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access the console
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button disabled={isLoading} className="w-full shadow-lg" size="lg">
                            {isLoading && (
                                <span className="mr-2 h-4 w-4 animate-spin border-2 border-white/20 border-t-white rounded-full"></span>
                            )}
                            Sign In
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <a href="#" className="underline underline-offset-4 hover:text-primary">
                            Contact Admin
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
