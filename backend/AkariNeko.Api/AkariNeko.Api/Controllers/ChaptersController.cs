using AkariNeko.Api.Data;
using AkariNeko.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/chapters")]
public class ChaptersController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public ChaptersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Lấy danh sách chapter.
    /// </summary>
    [HttpGet]
    public IActionResult GetChapters()
    {
        List<Chapter> chapters = _dbContext.Chapters
            .OrderBy(chapter => chapter.BookId)
            .ThenBy(chapter => chapter.OrderNo)
            .ToList();

        return Ok(chapters);
    }

    /// <summary>
    /// Lấy chapter theo BookId.
    /// </summary>
    [HttpGet("by-book/{bookId:int}")]
    public IActionResult GetChaptersByBookId(int bookId)
    {
        List<Chapter> chapters = _dbContext.Chapters
            .Where(chapter => chapter.BookId == bookId)
            .OrderBy(chapter => chapter.OrderNo)
            .ToList();

        return Ok(chapters);
    }

    /// <summary>
    /// Thêm dữ liệu chapter mẫu.
    /// </summary>
    [HttpGet("seed")]
    public IActionResult SeedChapters()
    {
        if (_dbContext.Chapters.Any())
        {
            return BadRequest("Đã có dữ liệu chapter rồi.");
        }

        List<Chapter> chapters =
        [
            new Chapter
            {
                BookId = 1,
                Name = "Chapter 1",
                OrderNo = 1,
                Level = "N4"
            },
            new Chapter
            {
                BookId = 1,
                Name = "Chapter 2",
                OrderNo = 2,
                Level = "N4"
            },
            new Chapter
            {
                BookId = 2,
                Name = "Bài 1",
                OrderNo = 1,
                Level = "N5"
            },
            new Chapter
            {
                BookId = 2,
                Name = "Bài 2",
                OrderNo = 2,
                Level = "N5"
            },
            new Chapter
            {
                BookId = 3,
                Name = "Grammar 1",
                OrderNo = 1,
                Level = "N3"
            }
        ];

        _dbContext.Chapters.AddRange(chapters);
        _dbContext.SaveChanges();

        return Ok(new
        {
            Message = "Đã thêm dữ liệu mẫu cho Chapters.",
            Count = chapters.Count
        });
    }
    #endregion
}