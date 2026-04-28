using AkariNeko.Api.Data;
using AkariNeko.Api.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace AkariNeko.Api.Controllers;

[ApiController]
[Route("api/statistics")]
public class StatisticsController : ControllerBase
{
    #region Fields
    private readonly AppDbContext _dbContext;
    #endregion

    #region Constructors
    public StatisticsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #endregion

    #region API Actions
    /// <summary>
    /// Lấy thống kê học tập của user.
    /// </summary>
    [HttpGet("vocabularies")]
    public IActionResult GetVocabularyStatistics([FromQuery] string userId)
    {
        int totalVocabularyCount = _dbContext.Vocabularies.Count();

        List<Models.UserVocabularyProgress> progresses = _dbContext.UserVocabularyProgresses
            .Where(item => item.UserId == userId)
            .ToList();

        int studiedVocabularyCount = progresses
            .Select(item => item.VocabularyId)
            .Distinct()
            .Count();

        int totalCorrectCount = progresses.Sum(item => item.CorrectCount);
        int totalWrongCount = progresses.Sum(item => item.WrongCount);
        int difficultVocabularyCount = progresses.Count(item => item.IsDifficult);

        int totalAnsweredCount = totalCorrectCount + totalWrongCount;

        double accuracyRate = totalAnsweredCount == 0
            ? 0
            : (double)totalCorrectCount / totalAnsweredCount * 100;

        StudyStatisticsDto statistics = new()
        {
            TotalVocabularyCount = totalVocabularyCount,
            StudiedVocabularyCount = studiedVocabularyCount,
            TotalCorrectCount = totalCorrectCount,
            TotalWrongCount = totalWrongCount,
            DifficultVocabularyCount = difficultVocabularyCount,
            AccuracyRate = Math.Round(accuracyRate, 2)
        };

        return Ok(statistics);
    }
    #endregion
}