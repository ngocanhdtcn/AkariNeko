namespace AkariNeko.Api.Models;

/// <summary>
/// Tiến độ học từ vựng của từng user.
/// </summary>
public class UserVocabularyProgress
{
    #region Properties
    /// <summary>
    /// Khóa chính.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Id user.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Id từ vựng.
    /// </summary>
    public int VocabularyId { get; set; }

    /// <summary>
    /// Số lần trả lời đúng.
    /// </summary>
    public int CorrectCount { get; set; }

    /// <summary>
    /// Số lần trả lời sai.
    /// </summary>
    public int WrongCount { get; set; }

    /// <summary>
    /// Có phải từ khó không.
    /// </summary>
    public bool IsDifficult { get; set; }

    /// <summary>
    /// Thời gian học gần nhất.
    /// </summary>
    public DateTime? LastStudiedAt { get; set; }
    #endregion
}