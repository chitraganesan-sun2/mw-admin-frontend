import { request } from "@/api/api-client";
import { showToast } from "@/components/common/Toast";

/**
 * Downloads a CSV from an authenticated admin export endpoint and triggers a
 * browser save. Uses the shared axios instance (via request()) so the
 * Authorization header is attached the same way every other admin API call
 * gets it — a raw `window.open(url)`/query-string-token approach can't set
 * headers and doesn't match how auth actually works here.
 */
export async function downloadCsv(endpoint: string, filename: string) {
    try {
        const response: any = await request({
            method: "GET",
            url: endpoint,
            responseType: "blob",
        });
        const blob = new Blob([response.data], { type: "text/csv" });
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
        showToast({ message: "Failed to download CSV export", type: "error" });
    }
}
