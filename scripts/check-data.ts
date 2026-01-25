
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function main() {
    try {
        const userCount = await prisma.users.count()
        const profileCount = await prisma.profiles.count()
        const orgCount = await prisma.organizations.count()

        console.log(`Users: ${userCount}`)
        console.log(`Profiles: ${profileCount}`)
        console.log(`Organizations: ${orgCount}`)

        if (userCount > 0 && profileCount === 0) {
            console.log("ALERT: Users exist but Profiles are missing. This causes the app to fallback to Mock Data.")

            // Attempt to list users to help identifying who needs a profile
            const users = await prisma.users.findMany({ take: 5 })
            console.log("Sample Users:", JSON.stringify(users, null, 2))
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
