import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
/**
 * Gera PDF A4 a partir de um elemento HTML (resumo do pedido).
 * Pagina automaticamente se o conteúdo for mais alto que uma página.
 */
export async function downloadPedidoPdfFromElement(element, filename) {
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;
    let renderW = maxW;
    let renderH = (canvas.height * renderW) / canvas.width;
    if (renderH > maxH) {
        renderH = maxH;
        renderW = (canvas.width * renderH) / canvas.height;
    }
    pdf.addImage(imgData, 'PNG', margin, margin, renderW, renderH);
    pdf.save(filename);
}
