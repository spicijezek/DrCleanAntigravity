import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export const generateInvoicePDF = async (elementId: string) => {
    // 1. Get the source element
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return null;
    }

    // 2. Wait for images to load within the element
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
        });
    }));

    // 3. Create a temporary container for the clone
    // We append it to body but keep it as "visible" as possible for the browser engine
    // while hiding it from the user. Some mobile browsers cull elements that are far off-screen.
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-3000px'; // Moving it far off-screen instead of just opacity
    container.style.top = '0';
    container.style.width = '794px'; // A4 width at ~96 DPI
    container.style.zIndex = '-1';
    container.style.opacity = '1';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    // 4. Create clone
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '794px';
    clone.style.minHeight = '1123px'; // A4 height
    clone.style.background = 'white';
    clone.style.margin = '0';
    clone.style.padding = '40px'; // Moderate padding
    clone.style.boxSizing = 'border-box';

    // Ensure all images in clone are loaded (since we cloned nodes, src should be there, but browser might re-fetch)
    // Actually html2canvas handles this usually, but let's be safe by appending first
    container.appendChild(clone);

    try {
        // 5. Generate Canvas
        // Increased scale for better quality
        const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false, // Set to true if debugging needed
            width: 794,
            windowWidth: 794,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });

        // 6. Generate PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95); // JPEG is often smaller/faster than PNG for photos
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // If content is taller than A4, we might need multiple pages, 
        // but user specifically requested single page or "works properly".
        // For invoices, usually fitting to width and letting height flow is standard, 
        // but if it cuts off, we might just scale to fit if it's slightly larger, 
        // or let it spill to page 2.
        // For now, let's just print the image.
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);

        return pdf;
    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Chyba při generování PDF");
        return null;
    } finally {
        // 7. Cleanup
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};

export const downloadPDF = async (elementId: string, filename: string) => {
    try {
        const pdf = await generateInvoicePDF(elementId);
        if (pdf) {
            // Ensure filename ends with .pdf
            const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
            pdf.save(finalFilename);
            return true;
        }
    } catch (e) {
        console.error("Download PDF failed:", e);
    }
    return false;
};
