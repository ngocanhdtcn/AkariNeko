using AkariNeko.Api.Data;
using AkariNeko.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/study-progress")]
public class StudyProgressController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public StudyProgressController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Đánh dấu trả lời đúng cho một từ.
    /// </summary>
    [HttpGet("mark-correct")]
    public IActionResult MarkCorrect(
        [FromQuery] string userId,
        [FromQuery] int vocabularyId)
    {
        UserVocabularyProgress? progress = _dbContext.UserVocabularyProgresses
            .FirstOrDefault(item =>
                item.UserId == userId &&
                item.VocabularyId == vocabularyId);

        if (progress == null)
        {
            progress = new UserVocabularyProgress
            {
                UserId = userId,
                VocabularyId = vocabularyId,
                CorrectCount = 1,
                WrongCount = 0,
                IsDifficult = false,
                LastStudiedAt = DateTime.Now
            };

            _dbContext.UserVocabularyProgresses.Add(progress);
        }
        else
        {
            progress.CorrectCount++;
            progress.LastStudiedAt = DateTime.Now;
        }

        _dbContext.SaveChanges();

        return Ok(progress);
    }

    /// <summary>
    /// Đánh dấu trả lời sai cho một từ.
    /// </summary>
    [HttpGet("mark-wrong")]
    public IActionResult MarkWrong(
        [FromQuery] string userId,
        [FromQuery] int vocabularyId)
    {
        UserVocabularyProgress? progress = _dbContext.UserVocabularyProgresses
            .FirstOrDefault(item =>
                item.UserId == userId &&
                item.VocabularyId == vocabularyId);

        if (progress == null)
        {
            progress = new UserVocabularyProgress
            {
                UserId = userId,
                VocabularyId = vocabularyId,
                CorrectCount = 0,
                WrongCount = 1,
                IsDifficult = true,
                LastStudiedAt = DateTime.Now
            };

            _dbContext.UserVocabularyProgresses.Add(progress);
        }
        else
        {
            progress.WrongCount++;
            progress.IsDifficult = true;
            progress.LastStudiedAt = DateTime.Now;
        }

        _dbContext.SaveChanges();

        return Ok(progress);
    }

    /// <summary>
    /// Lấy tiến độ học từ vựng theo user.
    /// </summary>
    [HttpGet("vocabularies")]
    public IActionResult GetVocabularyProgresses([FromQuery] string userId)
    {
        List<UserVocabularyProgress> progresses = _dbContext.UserVocabularyProgresses
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.LastStudiedAt)
            .ToList();

        return Ok(progresses);
    }
    #endregion
}