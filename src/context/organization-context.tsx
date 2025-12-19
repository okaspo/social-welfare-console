'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrganizationContextType = {
    organization: any | null
    profile: any | null
    isLoading: boolean
    refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType>({
    organization: null,
    profile: null,
    isLoading: true,
    refreshOrganization: async () => { },
})

export function useOrganizationContext() {
    return useContext(OrganizationContext)
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const [organization, setOrganization] = useState<any | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchOrganization = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setOrganization(null)
                setProfile(null)
                return
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select(`
                    *,
                    organization:organizations (*)
                `)
                .eq('id', user.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                // organization might be an array or object depending on relationship, 
                // but usually it's single object for 1:1 or N:1 from profile POV if foreign key is on profile
                // Wait, based on layout.tsx: 
                // organization:organizations!inner (
                //     id, name, plan, ...
                // )
                // It seems to be a relation.

                const org = Array.isArray(profileData.organization)
                    ? profileData.organization[0]
                    : profileData.organization

                setOrganization(org || null)
            }
        } catch (error) {
            console.error('Error fetching organization:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrganization()

        // Optional: Subscription for realtime updates could go here
    }, [])

    return (
        <OrganizationContext.Provider value={{ organization, profile, isLoading, refreshOrganization: fetchOrganization }}>
            {children}
        </OrganizationContext.Provider>
    )
}
