using AkariNeko.Api.Data;
using AkariNeko.Api.DTOs;
using AkariNeko.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/vocabularies")]
public class VocabulariesController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public VocabulariesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Lấy toàn bộ danh sách từ vựng.
    /// </summary>
    [HttpGet]
    public IActionResult GetVocabularies()
    {
        List<Vocabulary> vocabularies = _dbContext.Vocabularies
            .OrderBy(vocabulary => vocabulary.Level)
            .ThenBy(vocabulary => vocabulary.Id)
            .ToList();

        return Ok(vocabularies);
    }

    /// <summary>
    /// Lấy danh sách từ vựng theo level.
    /// </summary>
    [HttpGet("by-level/{level}")]
    public IActionResult GetVocabulariesByLevel(string level)
    {
        List<Vocabulary> vocabularies = _dbContext.Vocabularies
            .Where(vocabulary => vocabulary.Level == level)
            .OrderBy(vocabulary => vocabulary.Id)
            .ToList();

        return Ok(vocabularies);
    }

    /// <summary>
    /// Lấy danh sách từ vựng theo chapter.
    /// </summary>
    [HttpGet("by-chapter/{chapterId:int}")]
    public IActionResult GetVocabulariesByChapterId(int chapterId)
    {
        List<Vocabulary> vocabularies = _dbContext.ChapterVocabularies
            .Where(chapterVocabulary => chapterVocabulary.ChapterId == chapterId)
            .Join(
                _dbContext.Vocabularies,
                chapterVocabulary => chapterVocabulary.VocabularyId,
                vocabulary => vocabulary.Id,
                (chapterVocabulary, vocabulary) => vocabulary)
            .OrderBy(vocabulary => vocabulary.Id)
            .ToList();

        return Ok(vocabularies);
    }

    /// <summary>
    /// Lấy danh sách từ vựng theo sách.
    /// </summary>
    [HttpGet("by-book/{bookId:int}")]
    public IActionResult GetVocabulariesByBookId(int bookId)
    {
        List<int> chapterIds = _dbContext.Chapters
            .Where(chapter => chapter.BookId == bookId)
            .Select(chapter => chapter.Id)
            .ToList();

        List<Vocabulary> vocabularies = _dbContext.ChapterVocabularies
            .Where(chapterVocabulary => chapterIds.Contains(chapterVocabulary.ChapterId))
            .Join(
                _dbContext.Vocabularies,
                chapterVocabulary => chapterVocabulary.VocabularyId,
                vocabulary => vocabulary.Id,
                (chapterVocabulary, vocabulary) => vocabulary)
            .Distinct()
            .OrderBy(vocabulary => vocabulary.Id)
            .ToList();

        return Ok(vocabularies);
    }

    /// <summary>
    /// Lọc từ vựng theo sách, chapter, level.
    /// </summary>
    [HttpGet("filter")]
    public IActionResult FilterVocabularies(
        [FromQuery] int? bookId,
        [FromQuery] int? chapterId,
        [FromQuery] string? level)
    {
        List<int> filteredChapterIds = [];

        if (chapterId.HasValue)
        {
            filteredChapterIds.Add(chapterId.Value);
        }
        else if (bookId.HasValue)
        {
            filteredChapterIds = _dbContext.Chapters
                .Where(chapter => chapter.BookId == bookId.Value)
                .Select(chapter => chapter.Id)
                .ToList();
        }

        IQueryable<Vocabulary> query = _dbContext.Vocabularies;

        if (filteredChapterIds.Count > 0)
        {
            query = _dbContext.ChapterVocabularies
                .Where(chapterVocabulary => filteredChapterIds.Contains(chapterVocabulary.ChapterId))
                .Join(
                    _dbContext.Vocabularies,
                    chapterVocabulary => chapterVocabulary.VocabularyId,
                    vocabulary => vocabulary.Id,
                    (chapterVocabulary, vocabulary) => vocabulary)
                .Distinct();
        }

        if (!string.IsNullOrWhiteSpace(level))
        {
            query = query.Where(vocabulary => vocabulary.Level == level);
        }

        List<Vocabulary> vocabularies = query
            .OrderBy(vocabulary => vocabulary.Level)
            .ThenBy(vocabulary => vocabulary.Id)
            .ToList();

        return Ok(vocabularies);
    }

    /// <summary>
    /// Thêm dữ liệu từ vựng mẫu.
    /// </summary>
    [HttpGet("seed")]
    public IActionResult SeedVocabularies()
    {
        if (_dbContext.Vocabularies.Any())
        {
            return BadRequest("Đã có dữ liệu từ vựng rồi.");
        }

        List<Vocabulary> vocabularies =
        [
            new Vocabulary
            {
                Kanji = "家族",
                Hiragana = "かぞく",
                Meaning = "Gia đình",
                Example = "家族と一緒に晩ご飯を食べます。",
                Level = "N4"
            },
            new Vocabulary
            {
                Kanji = "便利",
                Hiragana = "べんり",
                Meaning = "Tiện lợi",
                Example = "このアプリはとても便利です。",
                Level = "N4"
            },
            new Vocabulary
            {
                Kanji = "勉強",
                Hiragana = "べんきょう",
                Meaning = "Học tập",
                Example = "毎日日本語を勉強しています。",
                Level = "N5"
            },
            new Vocabulary
            {
                Kanji = "大切",
                Hiragana = "たいせつ",
                Meaning = "Quan trọng",
                Example = "家族はとても大切です。",
                Level = "N4"
            },
            new Vocabulary
            {
                Kanji = "挑戦",
                Hiragana = "ちょうせん",
                Meaning = "Thử thách",
                Example = "新しいことに挑戦したいです。",
                Level = "N3"
            }
        ];

        _dbContext.Vocabularies.AddRange(vocabularies);
        _dbContext.SaveChanges();

        return Ok(new
        {
            Message = "Đã thêm dữ liệu mẫu cho Vocabularies.",
            Count = vocabularies.Count
        });
    }

    /// <summary>
    /// Lấy danh sách từ vựng kèm thông tin sách và chapter.
    /// </summary>
    [HttpGet("details")]
    public IActionResult GetVocabularyDetails(
        [FromQuery] int? bookId,
        [FromQuery] int? chapterId,
        [FromQuery] string? level)
    {
        List<VocabularyDto> vocabularyDetails = _dbContext.ChapterVocabularies
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
                (temp, vocabulary) => new VocabularyDto
                {
                    Id = vocabulary.Id,
                    Kanji = vocabulary.Kanji,
                    Hiragana = vocabulary.Hiragana,
                    Meaning = vocabulary.Meaning,
                    Example = vocabulary.Example,
                    Level = vocabulary.Level,
                    BookId = temp.Book.Id,
                    BookName = temp.Book.Name,
                    ChapterId = temp.Chapter.Id,
                    ChapterName = temp.Chapter.Name
                })
            .Where(vocabulary => !bookId.HasValue || vocabulary.BookId == bookId.Value)
            .Where(vocabulary => !chapterId.HasValue || vocabulary.ChapterId == chapterId.Value)
            .Where(vocabulary => string.IsNullOrWhiteSpace(level) || vocabulary.Level == level)
            .OrderBy(vocabulary => vocabulary.BookId)
            .ThenBy(vocabulary => vocabulary.ChapterId)
            .ThenBy(vocabulary => vocabulary.Id)
            .ToList();

        return Ok(vocabularyDetails);
    }
    #endregion
}