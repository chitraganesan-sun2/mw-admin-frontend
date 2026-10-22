import { request } from "@/api/api-client";
import { getApiErrorMessage } from "@/utils/apiError";
import { showToast } from "@/components/common/Toast";

/**
 * Downloads a file from an authenticated admin endpoint and triggers a browser save. Goes through
 * the shared axios instance so the Authorization header is attached like every other admin call
 * (a plain link or window.open can't send it, and the resume endpoint refuses anonymous callers).
 */
export async function downloadFile(endpoint: string, filename: string, failureMessage = "Couldn't download the file. Please try again.") {
  try {
    const response: any = await request({ method: "GET", url: endpoint, responseType: "blob" });
    const blob = new Blob([response.data], { type: response.headers?.["content-type"] || "application/octet-stream" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error: any) {
    // A failed blob request carries its JSON error body as a Blob; read the detail out of it.
    let detail: any = error?.data?.detail;
    if (!detail && error?.data instanceof Blob) {
      try {
        detail = JSON.parse(await error.data.text())?.detail;
      } catch {
        /* not JSON */
      }
    }
    showToast({ message: getApiErrorMessage({ ...error, data: { detail } }, failureMessage), type: "error" });
  }
}
