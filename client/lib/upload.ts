/**
 * Uploads a file to the server and returns the URL of the uploaded file.
 * Includes robust error handling and content type checking.
 * @param file The file to upload.
 * @returns A promise that resolves with the URL of the uploaded file.
 * @throws An error if the upload fails or the response is not as expected.
 */
export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  
  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error("Upload API error response (not OK status):", errorText);
      throw new Error(`File upload failed with status ${r.status}: ${errorText}`);
    }

    const contentType = r.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await r.text();
      console.error("Upload API received non-JSON response:", responseText);
      throw new Error(`File upload received unexpected response format. Expected JSON, got: ${responseText.substring(0, 200)}...`);
    }

    const j = await r.json();
    if (!j.url) {
      console.error("Upload API response missing 'url' field:", j);
      throw new Error("File upload response missing URL in JSON.");
    }
    // Construct an absolute URL
    return `${window.location.origin}${j.url}` as string;
  } catch (error: any) {
    console.error("Error during file upload process:", error);
    throw new Error(`File upload process failed: ${error.message || "Unknown error"}`);
  }
}