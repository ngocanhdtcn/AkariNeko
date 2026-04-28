namespace AkariNeko.Api.DTOs;

/// <summary>
/// DTO thống kê học tập.
/// </summary>
public class StudyStatisticsDto
{
    #region Properties
    /// <summary>
    /// Tổng số từ.
    /// </summary>
    public int TotalVocabularyCount { get; set; }

    /// <summary>
    /// Số từ đã học.
    /// </summary>
    public int StudiedVocabularyCount { get; set; }

    /// <summary>
    /// Tổng số lần đúng.
    /// </summary>
    public int TotalCorrectCount { get; set; }

    /// <summary>
    /// Tổng số lần sai.
    /// </summary>
    public int TotalWrongCount { get; set; }

    /// <summary>
    /// Số từ khó.
    /// </summary>
    public int DifficultVocabularyCount { get; set; }

    /// <summary>
    /// Tỷ lệ đúng.
    /// </summary>
    public double AccuracyRate { get; set; }
    #endregion
}