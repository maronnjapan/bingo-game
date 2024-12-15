import { Redis } from "@upstash/redis";
import { get } from "http";

const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
})

export const db = {
    upsert: async ({ id, data }: { id: string, data: string }) => {
        const result = await redis.get<string | null>(id)
        console.log(result, 'upsert')
        if (!result) {
            return await redis.set(id, JSON.stringify([data]))
        }

        if (Array.isArray(result)) {
            return await redis.set(id, JSON.stringify([...result, data]))

        }
    }
    ,
    getById: async (id: string): Promise<string[]> => {
        const result = await redis.get<string | null>(id)
        if (!result) {
            return []
        }

        if (Array.isArray(result)) {
            console.log('return value', result)
            return result as string[];
        }
        throw new Error('不正なデータです')
    },
    delete: async (id: string) => {
        return await redis.del(id)
    }
}