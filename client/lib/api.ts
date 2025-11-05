import { toast } from "sonner"; // Import toast from sonner

export async function api<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 401 || res.status === 403) {
      toast.error("Session expired or unauthorized. Please log in again.");
      window.location.href = "/login"; // Redirect to login page
    }
    throw new Error(errorText);
  }
  return res.json();
}