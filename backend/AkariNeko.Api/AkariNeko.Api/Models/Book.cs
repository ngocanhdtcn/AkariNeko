namespace AkariNeko.Api.Models;

/// <summary>
/// Thông tin sách / giáo trình học.
/// </summary>
public class Book
{
    #region Properties
    /// <summary>
    /// Khóa chính.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Tên sách.
    /// Ví dụ: JLPT Từ vựng, Minna no Nihongo.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Loại sách.
    /// Ví dụ: Vocabulary / Grammar / Exam.
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Mô tả thêm về sách.
    /// </summary>
    public string Description { get; set; } = string.Empty;
    #endregion
}