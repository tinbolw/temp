import {
  BooleanState,
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  Form,
  ImageRequestHandler,
  NetworkRequest,
  PagedResult,
  Property,
  RunnerInfo,
  RunnerPreferenceProvider,
  SourceConfig,
  UITextField,
} from "@suwatte/daisuke";

import { GetAllMangaQuery, GetMangaQuery, GetMangaChaptersQuery, GetChapterPagesQuery } from "./gql";

import { GetAllMangasResponse, GetChapterPagesResponse, GetMangaChaptersResponse, GetMangaResponse } from "./types";

import { genAuthHeader, graphqlPost, matchMangaStatus } from "./utils";

export class Target
  implements
  ContentSource,
  ImageRequestHandler, 
  RunnerPreferenceProvider {
  baseUrl = "";

  info: RunnerInfo = {
    id: "tin.suwayomi",
    name: "Suwayomi",
    version: 0.1,
    thumbnail: "suwayomi.png",
    website: "https://github.com/Suwayomi/Suwayomi-Server",
    supportedLanguages: ["UNIVERSAL"],
    rating: CatalogRating.SAFE,
  };
  
  config: SourceConfig = {};

  apiUrl = "";
  client = new NetworkClient();

  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    // loading suwayomi server URL here and when getting manga at getContent() to refresh if it is changed in config
    // those seem to be the two starting points of other api requests
    this.baseUrl = await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567";
    this.apiUrl = this.baseUrl + "/api/graphql";

    const response: GetAllMangasResponse = await graphqlPost(this.apiUrl, this.client, GetAllMangaQuery(request.query), 
      await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password"));

    const highlights = response.mangas.nodes
      .map((manga: { id: number; title: string; thumbnailUrl: string; }) => {
        // thumbnailUrl is relative to the Suwayomi server URL
        const imageUrl = this.baseUrl + manga.thumbnailUrl;
        return {
          id: manga.id.toString(),
          title: manga.title,
          cover: imageUrl,
        };
      });

    return {
      results: highlights,
      isLastPage: true,
    }
  }

  async getDirectoryConfig(_configID?: string | undefined,): Promise<DirectoryConfig> {
    return {};
  }

  async getContent(contentId: string): Promise<Content> {
    this.baseUrl = await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567";
    this.apiUrl = this.baseUrl + "/api/graphql";

    this.info = {
      ...this.info,
      website: this.baseUrl,
    }

    const response: GetMangaResponse = await graphqlPost(this.apiUrl, this.client, GetMangaQuery(contentId), 
      await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password")) ;

    const manga = response.manga;

    const properties: Property[] = [];
    properties.push(
      {
        id: "genres",
        title: "Genres",
        tags: [
          {
            id: "sourceName",
            title: response.manga.source.displayName,
          },
          ...manga.genre.map((genre: string) => {
            return {
              id: genre,
              title: genre,
            };
          })
        ]
      }
    )

    return {
      title: manga.title,
      cover: this.baseUrl + manga.thumbnailUrl,
      webUrl: `${this.baseUrl}/manga/${manga.id}`, // api seems to provide wrong local url
      status: matchMangaStatus(manga.status),
      creators: manga.author.split(", "),
      summary: manga.description,
      properties: properties,
    };
  }

  async getChapters(contentId: string): Promise<Chapter[]> {

    const response: GetMangaChaptersResponse = await graphqlPost(this.apiUrl, this.client, GetMangaChaptersQuery(contentId), 
      await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password")) ;

    const chapters: Chapter[] = [];

    response.manga.chapters.nodes.reverse(); // order latest first

    for (let chapterIndex = 0; chapterIndex < response.manga.chapters.nodes.length; chapterIndex++) {
      const chapter = response.manga.chapters.nodes[chapterIndex];
      chapters.push(
        {
          chapterId: chapter.id.toString(),
          number: chapter.chapterNumber,
          index: chapterIndex,
          // webUrl: `${this.baseUrl}/manga/${parsedJson.data.manga.id}/chapter/${chapterIndex}`,
          date: new Date(parseInt(chapter.uploadDate)),
          language: response.manga.source.lang, // api does not provide language on a per-chapter basis
          title: chapter.name,
          providers: [{ id: chapter.scanlator, name: chapter.scanlator }],
        }
      )
    }

    return chapters;
  }

  async getChapterData(contentId: string, chapterId: string): Promise<ChapterData> {
    const response: GetChapterPagesResponse = await graphqlPost(this.apiUrl, this.client, GetChapterPagesQuery(chapterId), 
      await ObjectStore.string("suwayomi_username"), await ObjectStore.string("suwayomi_password")) ;

    return {
      pages: response.fetchChapterPages.pages.map((entry: string) => {
        return {
          url: this.baseUrl + entry,
        };
      })
    }
  }

  async getPreferenceMenu(): Promise<Form> {
    return {
      sections: [
        // add select for authentication type
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
  }

  // required for suwayomi authentication
  async willRequestImage(imageURL: string): Promise<NetworkRequest> {
    return {
      url: imageURL,
      method: "GET",
      headers: {
        "authorization": `Basic ${genAuthHeader(
          await ObjectStore.string("suwayomi_username"), 
          await ObjectStore.string("suwayomi_password")
        )}`,
      },
    }
  }

  async onEnvironmentLoaded(): Promise<void> {
    this.config = {
      cloudflareResolutionURL: await ObjectStore.string("suwayomi_url") ?? "http://127.0.0.1:4567",
    };
  }
}