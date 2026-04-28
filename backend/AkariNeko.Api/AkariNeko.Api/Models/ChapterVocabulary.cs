namespace AkariNeko.Api.Models;

/// <summary>
/// Bảng liên kết giữa chapter và từ vựng.
/// </summary>
public class ChapterVocabulary
{
    #region Properties
    /// <summary>
    /// Khóa chính.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Id chapter.
    /// </summary>
    public int ChapterId { get; set; }

    /// <summary>
    /// Id từ vựng.
    /// </summary>
    public int VocabularyId { get; set; }
    #endregion
}