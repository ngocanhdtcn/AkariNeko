using AkariNeko.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AkariNeko.Api.Data;

/// <summary>
/// DbContext chính của ứng dụng.
/// </summary>
public class AppDbContext : DbContext
{
    #region Constructors
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    #endregion

    #region DbSets
    /// <summary>
    /// Danh sách sách / giáo trình.
    /// </summary>
    public DbSet<Book> Books { get; set; }

    /// <summary>
    /// Danh sách chapter.
    /// </summary>
    public DbSet<Chapter> Chapters { get; set; }

    /// <summary>
    /// Danh sách từ vựng.
    /// </summary>
    public DbSet<Vocabulary> Vocabularies { get; set; }

    /// <summary>
    /// Danh sách liên kết giữa chapter và từ vựng.
    /// </summary>
    public DbSet<ChapterVocabulary> ChapterVocabularies { get; set; }

    /// <summary>
    /// Tiến độ học từ vựng của user.
    /// </summary>
    public DbSet<UserVocabularyProgress> UserVocabularyProgresses { get; set; }
    #endregion
}