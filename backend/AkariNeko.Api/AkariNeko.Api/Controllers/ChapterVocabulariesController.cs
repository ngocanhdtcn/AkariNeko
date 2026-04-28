using AkariNeko.Api.Data;
using AkariNeko.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/chapter-vocabularies")]
public class ChapterVocabulariesController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public ChapterVocabulariesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Thêm dữ liệu liên kết chapter - vocabulary mẫu.
    /// </summary>
    [HttpGet("seed")]
    public IActionResult SeedChapterVocabularies()
    {
        if (_dbContext.ChapterVocabularies.Any())
        {
            return BadRequest("Đã có dữ liệu liên kết chapter và từ vựng rồi.");
        }

        List<ChapterVocabulary> chapterVocabularies =
        [
            new ChapterVocabulary
            {
                ChapterId = 1,
                VocabularyId = 1
            },
            new ChapterVocabulary
            {
                ChapterId = 1,
                VocabularyId = 2
            },
            new ChapterVocabulary
            {
                ChapterId = 1,
                VocabularyId = 4
            },
            new ChapterVocabulary
            {
                ChapterId = 2,
                VocabularyId = 5
            },
            new ChapterVocabulary
            {
                ChapterId = 3,
                VocabularyId = 3
            }
        ];

        _dbContext.ChapterVocabularies.AddRange(chapterVocabularies);
        _dbContext.SaveChanges();

        return Ok(new
        {
            Message = "Đã thêm dữ liệu mẫu cho ChapterVocabularies.",
            Count = chapterVocabularies.Count
        });
    }
    #endregion
}