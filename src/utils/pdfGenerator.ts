import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";

export const generateAndUploadInvoicePDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error("Element for PDF generation not found:", elementId);
        return null;
    }

    // Create clone to avoid issues with scroll/visibility
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '794px'; // A4 width at 96dpi
    clone.style.minHeight = '1123px'; // A4 height
    clone.style.position = 'absolute';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.zIndex = '-1';
    clone.style.background = 'white';
    document.body.appendChild(clone);

    try {
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 794,
            allowTaint: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        const pdfBlob = pdf.output('blob');
        const cloudinaryUrl = await uploadToCloudinary(pdfBlob);

        return cloudinaryUrl;
    } catch (error) {
        console.error("PDF Generation/Upload Error:", error);
        return null;
    } finally {
        document.body.removeChild(clone);
    }
};
