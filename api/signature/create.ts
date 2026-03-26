export default async function handler(req: any, res: any) {
  try {
    const body = JSON.parse(req.body || "{}");

    const docId = "doc_" + Date.now();

    // 🔥 Simulação (depois integra ZapSign aqui)
    return res.status(200).json({
      id: docId,
      status: "pending",
      link: `${req.headers.origin}/assinatura/${docId}`
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}