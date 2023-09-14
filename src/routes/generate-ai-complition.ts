import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod"
import { createReadStream } from "node:fs";
import { openai } from "../lib/openai"


export async function generateAICompletionRoute(app: FastifyInstance) {
    app.post('/ai/complete', async ( req, reply) => {
        const bodySchema = z.object({
            template: z.string(),
            videoId: z.string().uuid(),
            temperatura: z.number().min(0).max(1).default(0.5)
        })

        const { videoId, temperatura, template } = bodySchema.parse(req.body)

        const video = await prisma.video.findFirstOrThrow({
            where: {
                id: videoId
            }
        })

        if(!video.transcription) {
            return reply.status(400).send({ error: "Video transcription was not generate"})
        }

        const promptMessage = template.replace('{transcription}', video.transcription)

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            temperature: temperatura,
            messages: [
                { role: 'user', content: promptMessage}
            ]
        })

        return response
    })
}