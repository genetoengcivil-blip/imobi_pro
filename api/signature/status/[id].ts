export default async function handler(req: any, res: any) {
  try {
    const { id } = req.query;

    return res.status(200).json({
      id,
      status: "pending" // depois será dinâmico
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}