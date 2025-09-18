export function UpdateChaptersMutation(chapterIds: string[], isRead: boolean) {
  return `
    mutation UpdateChapters {
      updateChapters(input: {ids: [${chapterIds.toString()}] patch:{isRead:${isRead}}}) {
        chapters {
          isRead
        }
      }
    }
  `;
}