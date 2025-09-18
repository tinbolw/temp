export type GetAllMangasResponse = {
  mangas: {
    nodes: [
      {
        id: number,
        title: string,
        thumbnailUrl: string,
      }
    ]
  }
}

export type GetMangaResponse = {
  manga: {
    source: {
      displayName: string
    }
    title: string,
    thumbnailUrl: string,
    description: string,
    author: string,
    status: string,
    genre: string[],
    id: number,
    highestNumberedChapter: {
      chapterNumber: number
    }
    latestReadChapter: {
      chapterNumber: number
    }
  }
}

export type GetMangaChaptersResponse = {
  manga: {
    chapters: {
      nodes: {
        name: string,
        id: string,
        isRead: boolean,
        chapterNumber: number,
        url: string,
        uploadDate: string,
        scanlator: string
      }[]
    },
    id: number,
    source: {
      lang: string
    }
  }
}

export type GetChapterPagesResponse = {
  fetchChapterPages: {
    pages: string[]
  }
}