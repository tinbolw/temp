export function GetAllMangaQuery(search: string | undefined | null) {
  return `
  query AllCategories {
    mangas(filter: {title: {includesInsensitive: "${search ?? ""}"} inLibrary:{equalTo:true}}) {
      nodes {
        id
        title
        thumbnailUrl
      }
    }
  }
  `;
}

export function GetMangaQuery(contentId: string) {
  return `
    query GetManga {
      manga(id: ${contentId}) {
        source {
          displayName
        }
        title
        thumbnailUrl
        description
        author
        status
        genre
        id
        highestNumberedChapter {
          chapterNumber
        }
        latestReadChapter {
          chapterNumber
        }
      }
    }
  `;
}

export function GetMangaChaptersQuery(contentId: string) {
  return `
    query GetMangaChapters {
      manga(id: ${contentId}) {
        chapters {
          nodes {
            name
            id
            isRead
            chapterNumber
            url
            uploadDate
            scanlator
          }
        }
        id
        source {
          lang
        }
      }
    }
  `;
}

/* Technically a mutation, but the only place where you can fetch the actual chapter pages */
export function GetChapterPagesQuery(chapterId: string) {
  return `
    mutation GetChapterPages {
      fetchChapterPages(input: {chapterId: ${chapterId}}) {
        pages
      }
    }
  `
}