using AkariNeko.Api.Data;
using AkariNeko.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public BooksController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Lấy danh sách sách.
    /// </summary>
    [HttpGet]
    public IActionResult GetBooks()
    {
        List<Book> books = _dbContext.Books
            .OrderBy(book => book.Id)
            .ToList();

        return Ok(books);
    }

    /// <summary>
    /// Thêm một sách mẫu.
    /// </summary>
    [HttpPost("seed")]
    public IActionResult SeedBook()
    {
        if (_dbContext.Books.Any())
        {
            return BadRequest("Đã có dữ liệu sách rồi.");
        }

        List<Book> books =
        [
            new Book
            {
                Name = "JLPT Từ vựng",
                Type = "Vocabulary",
                Description = "Sách học từ vựng JLPT."
            },
            new Book
            {
                Name = "Minna no Nihongo",
                Type = "Vocabulary",
                Description = "Giáo trình Minna no Nihongo."
            },
            new Book
            {
                Name = "Soumatome Grammar",
                Type = "Grammar",
                Description = "Sách học ngữ pháp Soumatome."
            }
        ];

        _dbContext.Books.AddRange(books);
        _dbContext.SaveChanges();

        return Ok(new
        {
            Message = "Đã thêm dữ liệu mẫu cho Books.",
            Count = books.Count
        });
    }
    #endregion
}