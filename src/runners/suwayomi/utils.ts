import { PublicationStatus } from "@suwatte/daisuke";

/**
 * Generates the credentials portion of an HTTP Basic Authorization header.
 * @param username 
 * @param password 
 * @returns {(string|"")} The credentials, or an empty string if either username or password is null.
 */
export function genAuthHeader(username: string | null, password: string | null) : string {
  if (username && password) {
    return Buffer.from(`${username}:${password}`).toString('base64');
  } else {
    return "";
  }
}

/**
 * Matches the manga statuses provided by the Suwayomi API to those used by Suwatte.
 * @param {("UNKNOWN" | "ONGOING" | "COMPLETED" | "LICENSED" | "PUBLISHING_FINISHED" | "CANCELLED" | "ON_HIATUS")} status
 * @returns 
 */
export function matchMangaStatus(status: string) : PublicationStatus | undefined {
  switch (status) {
    case "ONGOING":
    case "LICENSED":
      return PublicationStatus.ONGOING;
    case "COMPLETED":
    case "PUBLISHING_FINISHED":
      return PublicationStatus.COMPLETED;
    case "CANCELLED":
      return PublicationStatus.CANCELLED;
    case "ON_HIATUS":
      return PublicationStatus.HIATUS;
    default:
      return undefined;
  }
}

export async function graphqlPost(apiUrl: string, client: NetworkClient, query: string,
  username: string | null, password: string | null) {
  const response = await client.post(apiUrl,
    {
      body: {
        "query": query,
      },
      headers: {
        "authorization": `Basic ${genAuthHeader(username, password)}`,
        "Content-Type": "application/json"
      },
    }
  );

  return JSON.parse(response.data).data;
}