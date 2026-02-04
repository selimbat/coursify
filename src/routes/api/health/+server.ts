import pool from '$lib/db';

export async function GET() {
    try {
        const result = await pool.query('SELECT NOW() as time');
        return new Response(
            JSON.stringify({
                message: 'Database connection successful',
                time: result.rows[0].time
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Database connection failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
