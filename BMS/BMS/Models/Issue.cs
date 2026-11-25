using System.ComponentModel.DataAnnotations.Schema;

namespace BMS.Models
{
    public class Issue
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public int MemberId { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? ReturnDate { get; set; }   // null = still borrowed

        [Column(TypeName = "decimal(10,2)")]
        public decimal FineAmount { get; set; }      // NEW: saved when the book is returned
    }

    public class IssueRequest
    {
        public int BookId { get; set; }
        public int MemberId { get; set; }
        public DateTime DueDate { get; set; }
    }
}