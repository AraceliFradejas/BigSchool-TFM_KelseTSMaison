// A persistent global daily ceiling also applies across Vercel instances.
// Failed provider calls count: an HTTP timeout does not prove zero provider cost.
export async function claimStylistCall(db, dailyLimit, now = new Date(), bucket = 'stylist_usage') {
  if (!['stylist_usage', 'stylist_voice_usage'].includes(bucket))
    throw new Error('Invalid quota bucket');
  const day = now.toISOString().slice(0, 10);
  if (db.kind === 'mongo') {
    try {
      return Boolean(
        await db
          .collection(bucket)
          .findOneAndUpdate(
            { _id: day, calls: { $lt: dailyLimit } },
            { $inc: { calls: 1 } },
            { upsert: true, returnDocument: 'after' },
          ),
      );
    } catch (error) {
      if (error.code === 11000) return false;
      throw error;
    }
  }
  return Boolean(
    db
      .prepare(
        `INSERT INTO ${bucket} (day,calls) VALUES (?,1)
    ON CONFLICT(day) DO UPDATE SET calls=calls+1 WHERE calls < ? RETURNING calls`,
      )
      .get(day, dailyLimit),
  );
}
