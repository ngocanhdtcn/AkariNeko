namespace AkariNeko.Api.DTOs;

/// <summary>
/// DTO hiển thị từ vựng kèm book, chapter và tiến độ học của user.
/// </summary>
public class UserVocabularyStudyDto
{
    #region Properties
    /// <summary>
    /// Id từ vựng.
    /// </summary>
    public int VocabularyId { get; set; }

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

    /// <summary>
    /// Số lần đúng.
    /// </summary>
    public int CorrectCount { get; set; }

    /// <summary>
    /// Số lần sai.
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