export default defineEventHandler(() => db().prepare('SELECT * FROM optouts ORDER BY created_at DESC LIMIT 500').all())
