import { Target } from "../runners/default";
import emulate from "@suwatte/emulator";
import { Validate } from "@suwatte/validate";
describe("Default Source Tests", () => {
  const source = emulate(Target);
  const CONTENT_ID = "";
  test("Get Content", async () => {
    const data = await source.getContent(CONTENT_ID);
    expect(Validate.object.content(data)).toBe(true);
  });

  test("Get Chapters", async () => {
    const chapters = await source.getChapters(CONTENT_ID);
    expect(Validate.array.chapter(chapters)).toBe(true);
  });

  test("Get ChapterData", async () => {
    const chapterId = "";
    const data = await source.getChapterData(CONTENT_ID, chapterId);
    expect(Validate.object.chapterData(data)).toBe(true);
  });

  test("Get Search Results", async () => {
    const results = await source.getSearchResults({
      page: 1,
      query: "doctor",
    });
    expect(results.results.length).toBeGreaterThan(5);
  });

  test("Get Source Tags", async () => {
    const tags = await source.getSourceTags();
    expect(tags);
  });
});
