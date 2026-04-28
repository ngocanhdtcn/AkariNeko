namespace AkariNeko.Api.Models;

/// <summary>
/// Thông tin một từ vựng.
/// </summary>
public class Vocabulary
{
    #region Properties
    /// <summary>
    /// Khóa chính.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Từ dạng Kanji.
    /// </summary>
    public string Kanji { get; set; } = string.Empty;

    /// <summary>
    /// Cách đọc Hiragana.
    /// </summary>
    public string Hiragana { get; set; } = string.Empty;

    /// <summary>
    /// Nghĩa tiếng Việt.
    /// </summary>
    public string Meaning { get; set; } = string.Empty;

    /// <summary>
    /// Ví dụ minh họa.
    /// </summary>
    public string Example { get; set; } = string.Empty;

    /// <summary>
    /// Cấp độ JLPT.
    /// Ví dụ: N5, N4, N3.
    /// </summary>
    public string Level { get; set; } = string.Empty;
    #endregion
}