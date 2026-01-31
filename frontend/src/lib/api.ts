export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type HttpMethod = "GET" | "POST" | "PATCH";

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    token?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const { method = "GET", token, body } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}

