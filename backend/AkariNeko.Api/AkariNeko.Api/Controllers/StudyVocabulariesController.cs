using AkariNeko.Api.Data;
using AkariNeko.Api.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/study-vocabularies")]
public class StudyVocabulariesController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public StudyVocabulariesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Lấy danh sách từ vựng học tập của user, kèm book, chapter và progress.
    /// </summary>
    [HttpGet]
    public IActionResult GetStudyVocabularies(
        [FromQuery] string userId,
        [FromQuery] int? bookId,
        [FromQuery] int? chapterId,
        [FromQuery] string? level,
        [FromQuery] string? mode)
    {
        List<UserVocabularyStudyDto> studyVocabularies = _dbContext.ChapterVocabularies
            .Join(
                _dbContext.Chapters,
                chapterVocabulary => chapterVocabulary.ChapterId,
                chapter => chapter.Id,
                (chapterVocabulary, chapter) => new
                {
                    ChapterVocabulary = chapterVocabulary,
                    Chapter = chapter
                })
            .Join(
                _dbContext.Books,
                temp => temp.Chapter.BookId,
                book => book.Id,
                (temp, book) => new
                {
                    temp.ChapterVocabulary,
                    temp.Chapter,
                    Book = book
                })
            .Join(
                _dbContext.Vocabularies,
                temp => temp.ChapterVocabulary.VocabularyId,
                vocabulary => vocabulary.Id,
                (temp, vocabulary) => new
                {
                    temp.ChapterVocabulary,
                    temp.Chapter,
                    temp.Book,
                    Vocabulary = vocabulary
                })
            .GroupJoin(
                _dbContext.UserVocabularyProgresses.Where(progress => progress.UserId == userId),
                temp => temp.Vocabulary.Id,
                progress => progress.VocabularyId,
                (temp, progresses) => new
                {
                    temp.Book,
                    temp.Chapter,
                    temp.Vocabulary,
                    Progress = progresses.FirstOrDefault()
                })
            .Select(item => new UserVocabularyStudyDto
            {
                VocabularyId = item.Vocabulary.Id,
                Kanji = item.Vocabulary.Kanji,
                Hiragana = item.Vocabulary.Hiragana,
                Meaning = item.Vocabulary.Meaning,
                Example = item.Vocabulary.Example,
                Level = item.Vocabulary.Level,
                BookId = item.Book.Id,
                BookName = item.Book.Name,
                ChapterId = item.Chapter.Id,
                ChapterName = item.Chapter.Name,
                CorrectCount = item.Progress != null ? item.Progress.CorrectCount : 0,
                WrongCount = item.Progress != null ? item.Progress.WrongCount : 0,
                IsDifficult = item.Progress != null && item.Progress.IsDifficult,
                LastStudiedAt = item.Progress != null ? item.Progress.LastStudiedAt : null
            })
            .Where(item => !bookId.HasValue || item.BookId == bookId.Value)
            .Where(item => !chapterId.HasValue || item.ChapterId == chapterId.Value)
            .Where(item => string.IsNullOrWhiteSpace(level) || item.Level == level)
            .ToList();

        if (!string.IsNullOrWhiteSpace(mode))
        {
            string normalizedMode = mode.Trim().ToLowerInvariant();

            studyVocabularies = normalizedMode switch
            {
                "difficult" => studyVocabularies
                    .Where(item => item.IsDifficult)
                    .ToList(),

                "wrong" => studyVocabularies
                    .Where(item => item.WrongCount > 0)
                    .ToList(),

                "notlearned" => studyVocabularies
                    .Where(item => item.CorrectCount == 0 && item.WrongCount == 0)
                    .ToList(),

                _ => studyVocabularies
            };
        }

        studyVocabularies = studyVocabularies
            .OrderBy(item => item.BookId)
            .ThenBy(item => item.ChapterId)
            .ThenBy(item => item.VocabularyId)
            .ToList();

        return Ok(studyVocabularies);
    }
    #endregion
}