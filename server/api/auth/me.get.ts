import { getSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  return { session }
})
