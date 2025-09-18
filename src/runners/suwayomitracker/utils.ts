import { RunnerInfo } from "@suwatte/daisuke";

export async function getBaseUrl() : Promise<string> {
  return await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567";
}

/**
 * Gets the API url of the Suwayomi server, or localhost if one is not defined.
 * @returns 
 */
export async function getApiUrl() : Promise<string> {
  return await getBaseUrl() + "/api/graphql";
}

export async function updateInfoWebsite(info: RunnerInfo, url:string) : Promise<RunnerInfo> {
  return {
    ...info,
    website: url,
  };
}