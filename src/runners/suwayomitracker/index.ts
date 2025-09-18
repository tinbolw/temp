import {
  RunnerPreferenceProvider,
  ContentTracker,
  Form,
  Highlight,
  ImageRequestHandler,
  NetworkRequest,
  RunnerAuthenticatable,
  RunnerInfo,
  TrackerConfig,
  TrackProgressUpdate,
  TrackStatus,
  UIStepper,
  UITextField,
} from "@suwatte/daisuke";

import { GetAllMangasResponse, GetMangaResponse, GetMangaChaptersResponse } from "../suwayomi/types";
import { GetAllMangaQuery, GetMangaChaptersQuery, GetMangaQuery } from "../suwayomi/gql"
import { genAuthHeader, graphqlPost } from "../suwayomi/utils";

import { UpdateChaptersMutation } from "./gql";
import { getApiUrl, getBaseUrl, updateInfoWebsite } from "./utils";

let tempUrl : string = "";
(async () => {
  tempUrl = await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567";
})();

const config: TrackerConfig = {
  linkKeys: ["suwayomi"],
};

const info: RunnerInfo = {
  id: "tin.suwayomitracker",
  name: "Suwayomi",
  version: 0.1,
  website: tempUrl,
  thumbnail: "suwayomi.png",
};

export const Target:
  ContentTracker &
  RunnerPreferenceProvider &
  ImageRequestHandler & 
  RunnerAuthenticatable = {
  info,
  config,

  async didUpdateLastReadChapter(id: string, progress: TrackProgressUpdate): Promise<void> {
    const client = new NetworkClient();
    const apiUrl = await getApiUrl();
    const username = await ObjectStore.string("suwayomi_username");
    const password = await ObjectStore.string("suwayomi_password");

    const response: GetMangaChaptersResponse = await graphqlPost(apiUrl, client,
      GetMangaChaptersQuery(id), username, password);

    // api implementation of filtering chapters is broken, manual solution
    const matches = response.manga.chapters.nodes // find the chapter and those before it
      .filter((chapter: { chapterNumber: any; }) => chapter.chapterNumber <= (progress.chapter ?? 0))
      .map((chapter) => chapter.id);

    if (matches.length == 0) {
      throw new Error("No chapter with that number found.");
    } else {
      await graphqlPost(apiUrl, client, UpdateChaptersMutation(matches, true),
      username, password);
    }
  },

  async getResultsForTitles(titles: string[]): Promise<Highlight[]> {
    const title = titles[0]; // api does not seem to support more than one title

    const baseUrl = await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567";
    const apiUrl = baseUrl + "/api/graphql";

    const response: GetAllMangasResponse = await graphqlPost(apiUrl, new NetworkClient(),
      GetAllMangaQuery(title), await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password"));

    const manga = response.mangas.nodes[0];

    return [{
      id: manga.id.toString(),
      title: manga.title,
      cover: baseUrl + manga.thumbnailUrl,
    }];
  },

  async getTrackItem(id: string): Promise<Highlight> {
    const baseUrl = await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567";
    const apiUrl = baseUrl + "/api/graphql";

    const response: GetMangaResponse = await graphqlPost(apiUrl, new NetworkClient(),
      GetMangaQuery(id), await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password"));

    return {
      id,
      title: response.manga.title,
      cover: baseUrl + response.manga.thumbnailUrl,
      webUrl: `${baseUrl}/manga/${id}`,
      entry: {
        status: TrackStatus.COMPLETED, // one that works
        progress: {
          maxAvailableChapter: response.manga.highestNumberedChapter.chapterNumber,
          lastReadChapter: response.manga.latestReadChapter?.chapterNumber ?? 0,
        }
      }
    }
  },

  async didUpdateStatus(id: string, status: TrackStatus): Promise<void> {
    throw new Error("Suwayomi does not support reading statuses.");
  },

  // doesn't seem like this is ever called
  async beginTracking(id: string, status: TrackStatus): Promise<void> {
    throw new Error("Not implemented");
  },

  async getEntryForm(id: string): Promise<Form> {
    const response: GetMangaResponse = await graphqlPost(await getApiUrl(), new NetworkClient(),
      GetMangaQuery(id), await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password"));

    const manga = response.manga;

    return {
      sections: [
        {
          header: "Reading Progress",
          children: [
            UIStepper({
              id: "progress",
              title: "Chapter",
              value: manga.latestReadChapter?.chapterNumber ?? 0,
              upperBound: manga.highestNumberedChapter.chapterNumber,
              allowDecimal: true,
            }),
          ]
        }
      ]
    }
  },

  async didSubmitEntryForm(id: string, form: any): Promise<void> {
    const client = new NetworkClient();
    const username = await ObjectStore.string("suwayomi_username");
    const password = await ObjectStore.string("suwayomi_password");
    const apiUrl = await getApiUrl();

    const response: GetMangaChaptersResponse = await graphqlPost(apiUrl, client,
      GetMangaChaptersQuery(id), await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password"));

    const chapters = response.manga.chapters.nodes;

    const matches = chapters.filter((chapter: { chapterNumber: any; }) => chapter.chapterNumber <= form.progress)
      .map((chapter) => chapter.id);
    const laterChapterIds = chapters.filter((chapter: { chapterNumber: any; }) => chapter.chapterNumber > (form.progress ?? 0))
      .map((chapter) => chapter.id);

    if (matches.length == 0 && form.progress != 0) {
      throw new Error("No chapter with that number found.");
    } else {
      await graphqlPost(apiUrl, client, UpdateChaptersMutation(matches, true), username, password);
    }
    await graphqlPost(apiUrl, client, UpdateChaptersMutation(laterChapterIds, false), username, password);
  },

  async getPreferenceMenu(): Promise<Form> {
    return {
      sections: [
        {
          header: "Server URL",
          footer: "The URL of the Suwayomi server",
          children: [
            UITextField({
              id: "suwayomi_url",
              title: "URL:",
              value: (await ObjectStore.string("suwayomi_url")) ?? "http://127.0.0.1:4567",
              async didChange(value) {
                return ObjectStore.set("suwayomi_url", value);
              },
            }),
          ],
        },
        {
          header: "Username",
          footer: "Suwayomi username, if set",
          children: [
            UITextField({
              id: "suwayomi_username",
              title: "Username:",
              value: (await ObjectStore.string("suwayomi_username")) ?? "",
              async didChange(value) {
                return ObjectStore.set("suwayomi_username", value);
              },
            }),
          ],
        },
        {
          header: "Password",
          children: [
            UITextField({
              id: "suwayomi_password",
              title: "Password:",
              secure: true,
              value: (await ObjectStore.string("suwayomi_password")) ?? "",
              async didChange(value) {
                return ObjectStore.set("suwayomi_password", value);
              },
            }),
          ],
        },
      ],
    };
  },

  async willRequestImage(imageURL: string): Promise<NetworkRequest> {
    return {
      url: imageURL,
      method: "GET",
      // body: {
      //   "query": GetAllMangaQuery,
      // },
      headers: {
        "authorization": `Basic ${genAuthHeader(
          await ObjectStore.string("suwayomi_username"),
          await ObjectStore.string("suwayomi_password")
        )}`,
        // "Content-Type": "application/json"
      },
    }
  },

  // placeholder methods to allow Suwatte to sync from Suwayomi, neither are supported
  async getAuthenticatedUser() {
    return {
      handle: "placeholder",
    }
  },

  async handleUserSignOut() {

  }
}