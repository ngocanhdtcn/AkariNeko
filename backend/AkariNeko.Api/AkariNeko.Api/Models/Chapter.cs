namespace AkariNeko.Api.Models;

/// <summary>
/// Thông tin chapter / bài học thuộc một cuốn sách.
/// </summary>
public class Chapter
{
    #region Properties
    /// <summary>
    /// Khóa chính.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Id của sách cha.
    /// </summary>
    public int BookId { get; set; }

    /// <summary>
    /// Tên chapter.
    /// Ví dụ: Chapter 1, Bài 1, 第1課.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Thứ tự hiển thị của chapter.
    /// </summary>
    public int OrderNo { get; set; }

    /// <summary>
    /// Cấp độ JLPT.
    /// Ví dụ: N5, N4, N3.
    /// </summary>
    public string Level { get; set; } = string.Empty;
    #endregion
}