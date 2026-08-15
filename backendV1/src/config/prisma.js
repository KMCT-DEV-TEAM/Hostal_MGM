import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import PrismaClientPkg from '@prisma/client';
const { PrismaClient } = PrismaClientPkg;

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

const connectDB = async () => {
    try {
        await prisma.$connect()
        console.log('DB connected via prisma')
    } catch (error) {
        console.error(`DB connection error: ${error.message}`);
        process.exit()
    }
}

const disConnectDB = async () => {
    await prisma.$disconnect()
}

export { prisma, connectDB, disConnectDB }