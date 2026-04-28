namespace AkariNeko.Api.DTOs;

/// <summary>
/// DTO hiển thị từ vựng kèm thông tin sách và chapter.
/// </summary>
public class VocabularyDto
{
    #region Properties
    /// <summary>
    /// Id từ vựng.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Kanji.
    /// </summary>
    public string Kanji { get; set; } = string.Empty;

    /// <summary>
    /// Hiragana.
    /// </summary>
    public string Hiragana { get; set; } = string.Empty;

    /// <summary>
    /// Nghĩa tiếng Việt.
    /// </summary>
    public string Meaning { get; set; } = string.Empty;

    /// <summary>
    /// Ví dụ.
    /// </summary>
    public string Example { get; set; } = string.Empty;

    /// <summary>
    /// Cấp độ JLPT.
    /// </summary>
    public string Level { get; set; } = string.Empty;

    /// <summary>
    /// Id sách.
    /// </summary>
    public int BookId { get; set; }

    /// <summary>
    /// Tên sách.
    /// </summary>
    public string BookName { get; set; } = string.Empty;

    /// <summary>
    /// Id chapter.
    /// </summary>
    public int ChapterId { get; set; }

    /// <summary>
    /// Tên chapter.
    /// </summary>
    public string ChapterName { get; set; } = string.Empty;
    #endregion
}