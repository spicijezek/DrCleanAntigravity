import { toast } from "sonner";

/**
 * Robustly downloads a file from a URL, handling cross-origin issues by fetching to a blob.
 * Especially useful for mobile devices and cross-origin links (like Cloudinary).
 * Returns true if download was initiated successfully, false otherwise.
 */
export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
    try {
        let finalUrl = url;

        // Handle Cloudinary - force download
        if (url.includes('cloudinary.com')) {
            finalUrl = url.replace('/upload/', '/upload/fl_attachment/');
        }

        // Try to fetch as blob for most reliable cross-device download
        // This allows the browser to respect the 'download' filename even for cross-origin URLs
        try {
            const response = await fetch(finalUrl, { mode: 'cors' });

            if (!response.ok) {
                console.warn(`Download failed with status: ${response.status}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
            return true;
        } catch (fetchError) {
            console.warn("Fetch failed, falling back to direct link download:", fetchError);

            // ONLY fallback to direct link if it was likely a CORS error, NOT a 404
            // If it was a 404 (handled above), we want to return false so the app generates a new PDF
            if (fetchError instanceof Error && fetchError.message.includes('HTTP error')) {
                return false;
            }

            // Fallback: direct link download (less reliable for cross-origin filenames, but better than nothing)
            const link = document.createElement('a');
            link.href = finalUrl;
            link.download = filename;
            link.target = '_blank'; // Open in new tab if download is blocked
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        }
    } catch (error) {
        console.error("Download failed:", error);
        // Do not toast here if we want the caller to handle the fallback silently (or toast themselves)
        // But for now, returning false lets caller decide.
        return false;
    }
};
