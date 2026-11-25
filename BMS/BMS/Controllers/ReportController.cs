using BMS.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly BookDbContext db;
        public ReportController(BookDbContext context) { db = context; }

        private class Row
        {
            public int Id { get; set; }
            public int BookId { get; set; }
            public string BookTitle { get; set; } = "";
            public int MemberId { get; set; }
            public string MemberName { get; set; } = "";
            public string NIC { get; set; } = "";
            public DateTime IssueDate { get; set; }
            public DateTime DueDate { get; set; }
            public DateTime? ReturnDate { get; set; }
            public decimal FineAmount { get; set; }
        }

        private IQueryable<Row> BaseRows() =>
            from i in db.Issues
            join b in db.Books on i.BookId equals b.Id
            join m in db.Members on i.MemberId equals m.ID
            select new Row
            {
                Id = i.Id,
                BookId = i.BookId,
                BookTitle = b.Title,
                MemberId = i.MemberId,
                MemberName = m.Name,
                NIC = m.NIC,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                ReturnDate = i.ReturnDate,
                FineAmount = i.FineAmount
            };

        // Adds status / days overdue / fine to each row
        private static object Shape(Row r)
        {
            string status;
            int late;
            decimal fine;

            if (r.ReturnDate != null)
            {
                status = "Returned";
                late = Math.Max(0, (r.ReturnDate.Value.Date - r.DueDate.Date).Days);
                fine = r.FineAmount;
            }
            else
            {
                late = Math.Max(0, (DateTime.Today - r.DueDate.Date).Days);
                status = late > 0 ? "Overdue" : "Issued";
                fine = late * IssueController.FinePerDay;   // fine accrued so far
            }

            return new
            {
                r.Id,
                r.BookId,
                r.BookTitle,
                r.MemberId,
                r.MemberName,
                r.NIC,
                r.IssueDate,
                r.DueDate,
                r.ReturnDate,
                status,
                daysOverdue = late,
                fine
            };
        }

        // All borrowing records (optional ?from=2025-01-01&to=2025-12-31 on issue date)
        [HttpGet("BorrowingHistory")]
        public async Task<IActionResult> BorrowingHistory(DateTime? from, DateTime? to)
        {
            var q = BaseRows();
            if (from.HasValue) q = q.Where(r => r.IssueDate >= from.Value.Date);
            if (to.HasValue) q = q.Where(r => r.IssueDate < to.Value.Date.AddDays(1));

            var rows = await q.OrderByDescending(r => r.Id).ToListAsync();
            return Ok(rows.Select(Shape));
        }

        [HttpGet("ReturnedBooks")]
        public async Task<IActionResult> ReturnedBooks()
        {
            var rows = await BaseRows()
                .Where(r => r.ReturnDate != null)
                .OrderByDescending(r => r.ReturnDate)
                .ToListAsync();
            return Ok(rows.Select(Shape));
        }

        [HttpGet("OverdueBooks")]
        public async Task<IActionResult> OverdueBooks()
        {
            var today = DateTime.Today;
            var rows = await BaseRows()
                .Where(r => r.ReturnDate == null && r.DueDate < today)
                .OrderBy(r => r.DueDate)
                .ToListAsync();
            return Ok(rows.Select(Shape));
        }

        [HttpGet("MemberHistory/{memberId}")]
        public async Task<IActionResult> MemberHistory(int memberId)
        {
            var rows = await BaseRows()
                .Where(r => r.MemberId == memberId)
                .OrderByDescending(r => r.Id)
                .ToListAsync();
            return Ok(rows.Select(Shape));
        }

        [HttpGet("BookInventory")]
        public async Task<IActionResult> BookInventory()
        {
            var books = await db.Books.OrderBy(b => b.Title).ToListAsync();
            var counts = await db.Issues
                .Where(i => i.ReturnDate == null)
                .GroupBy(i => i.BookId)
                .Select(g => new { BookId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.BookId, x => x.Count);

            return Ok(books.Select(b =>
            {
                var borrowed = counts.TryGetValue(b.Id, out var c) ? c : 0;
                var available = b.Quantity - borrowed;
                return new
                {
                    b.Id,
                    b.Title,
                    b.Author,
                    b.Publisher,
                    b.Year,
                    quantity = b.Quantity,
                    borrowed,
                    available,
                    status = available <= 0 ? "Out of Stock" : available <= 2 ? "Low Stock" : "In Stock"
                };
            }));
        }
    }
}