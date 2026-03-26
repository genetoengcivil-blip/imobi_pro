import jsPDF from "jspdf";

export function generatePremiumPDF(data: any) {
  const pdf = new jsPDF("p", "mm", "a4");

  // CAPA
  pdf.setFillColor(2, 23, 255);
  pdf.rect(0, 0, 210, 297, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.text("IMOBIPRO", 20, 60);

  pdf.setFontSize(14);
  pdf.text("Contrato Imobiliário", 20, 75);

  pdf.setFontSize(10);
  pdf.text(`Cliente: ${data.client_name}`, 20, 95);

  pdf.addPage();

  pdf.setTextColor(0, 0, 0);

  pdf.setFontSize(12);
  pdf.text("DADOS DO CONTRATO", 20, 20);

  pdf.setFontSize(10);
  pdf.text(`Cliente: ${data.client_name}`, 20, 35);
  pdf.text(`Imóvel: ${data.property_title || "-"}`, 20, 45);
  pdf.text(`Valor: ${data.value || "-"}`, 20, 55);

  const cleanText = (data.final_content || "").replace(/<[^>]+>/g, "");
  const splitText = pdf.splitTextToSize(cleanText, 170);

  pdf.text(splitText, 20, 70);

  pdf.text("______________________________", 20, 260);
  pdf.text("Assinatura do Cliente", 20, 270);

  pdf.save("contrato-imobipro.pdf");
}