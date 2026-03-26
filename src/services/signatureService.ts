// src/services/signatureService.ts

export async function enviarParaAssinatura(data: any) {
  try {
    const res = await fetch("/api/signature/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Erro ao enviar para assinatura");
    }

    return await res.json();

  } catch (err) {
    console.error("Erro assinatura:", err);

    // 🔥 fallback (não quebra app)
    return {
      id: "fake_" + Date.now(),
      link: "#",
      status: "error"
    };
  }
}

export async function verificarStatus(id: string) {
  try {
    const res = await fetch(`/api/signature/status?id=${id}`);

    if (!res.ok) {
      throw new Error("Erro ao consultar status");
    }

    return await res.json();

  } catch (err) {
    console.error("Erro status:", err);

    return {
      id,
      status: "unknown"
    };
  }
}