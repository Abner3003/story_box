import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

const databaseUrl = process.env.DATABASE_URL!
export const checkpointer = PostgresSaver.fromConnString(databaseUrl)
await checkpointer.setup()
