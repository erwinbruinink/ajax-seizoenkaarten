import { drizzle } from 'drizzle-orm/vercel-postgres'
import { sql } from '@vercel/postgres'
import * as schema from './schema'

// The @vercel/postgres `sql` client reads POSTGRES_URL from process.env automatically.
// Make sure it's set locally (.env) and in the Vercel project's environment variables.
export const db = drizzle(sql, { schema })
