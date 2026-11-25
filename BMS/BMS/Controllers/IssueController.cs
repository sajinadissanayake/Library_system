using BMS.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IssueController : ControllerBase
    {
        private readonly BookDbContext db;
        private const int MaxBooksPerMember = 3;
        public const decimal FinePerDay = 10m;   // Rs. per overdue day - change as needed

        public IssueController(BookDbContext context) { db = context; }

        [HttpGet("GetIssues")]
        public async Task<IActionResult> GetIssues()
        {
            var list = await (
                from i in db.Issues
                join b in db.Books on i.BookId equals b.Id
                join m in db.Members on i.MemberId equals m.ID
                orderby i.Id descending
                select new
                {
                    i.Id,
                    i.BookId,
                    BookTitle = b.Title,
                    i.MemberId,
                    MemberName = m.Name,
                    i.IssueDate,
                    i.DueDate,
                    i.ReturnDate,
                    i.FineAmount
                }).ToListAsync();

            return Ok(list);
        }

        [HttpGet("CheckAvailability/{bookId}")]
        public async Task<IActionResult> CheckAvailability(int bookId)
        {
            var book = await db.Books.FindAsync(bookId);
            if (book == null) return NotFound(new { message = "Book not found." });

            var issued = await db.Issues.CountAsync(i => i.BookId == bookId && i.ReturnDate == null);
            return Ok(new { bookId, total = book.Quantity, issued, available = book.Quantity - issued });
        }

        [HttpPost("IssueBook")]
        public async Task<IActionResult> IssueBook(IssueRequest req)
        {
            var book = await db.Books.FindAsync(req.BookId);
            if (book == null) return BadRequest(new { message = "Book not found." });

            var member = await db.Members.FindAsync(req.MemberId);
            if (member == null) return BadRequest(new { message = "Member not found." });

            if (req.DueDate.Date <= DateTime.Today)
                return BadRequest(new { message = "Return date must be after today." });

            var issued = await db.Issues.CountAsync(i => i.BookId == req.BookId && i.ReturnDate == null);
            if (book.Quantity - issued <= 0)
                return BadRequest(new { message = $"No copies of \"{book.Title}\" are available." });

            var memberLoans = await db.Issues
                .Where(i => i.MemberId == req.MemberId && i.ReturnDate == null)
                .ToListAsync();

            if (memberLoans.Count >= MaxBooksPerMember)
                return BadRequest(new { message = $"A member can borrow at most {MaxBooksPerMember} books." });

            if (memberLoans.Any(i => i.BookId == req.BookId))
                return BadRequest(new { message = "This member already has this book." });

            var issue = new Issue
            {
                BookId = req.BookId,
                MemberId = req.MemberId,
                IssueDate = DateTime.Now,
                DueDate = req.DueDate.Date
            };

            db.Issues.Add(issue);
            await db.SaveChangesAsync();
            return Ok(issue);
        }

        // ---------------- NEW: RETURN MANAGEMENT ----------------

        // Active (not yet returned) loans, with the fine that would be charged today
        [HttpGet("GetActiveLoans")]
        public async Task<IActionResult> GetActiveLoans()
        {
            var rows = await (
                from i in db.Issues
                where i.ReturnDate == null
                join b in db.Books on i.BookId equals b.Id
                join m in db.Members on i.MemberId equals m.ID
                orderby i.DueDate
                select new
                {
                    i.Id,
                    i.BookId,
                    BookTitle = b.Title,
                    i.MemberId,
                    MemberName = m.Name,
                    m.NIC,
                    i.IssueDate,
                    i.DueDate
                }).ToListAsync();

            var today = DateTime.Today;
            return Ok(rows.Select(r =>
            {
                var late = Math.Max(0, (today - r.DueDate.Date).Days);
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
                    daysOverdue = late,
                    fine = late * FinePerDay
                };
            }));
        }

        // Preview the fine before confirming the return
        [HttpGet("CalculateFine/{id}")]
        public async Task<IActionResult> CalculateFine(int id)
        {
            var issue = await db.Issues.FindAsync(id);
            if (issue == null) return NotFound(new { message = "Issue record not found." });
            if (issue.ReturnDate != null)
                return BadRequest(new { message = "This book was already returned." });

            var late = Math.Max(0, (DateTime.Today - issue.DueDate.Date).Days);
            return Ok(new { id, daysOverdue = late, finePerDay = FinePerDay, fine = late * FinePerDay });
        }

        // Record the return: sets actual return date + saves the fine.
        // Available quantity updates automatically because it is
        // Quantity - (issues with ReturnDate == null).
        [HttpPost("ReturnBook/{id}")]
        public async Task<IActionResult> ReturnBook(int id)
        {
            var issue = await db.Issues.FindAsync(id);
            if (issue == null) return NotFound(new { message = "Issue record not found." });
            if (issue.ReturnDate != null)
                return BadRequest(new { message = "This book was already returned." });

            var now = DateTime.Now;
            var late = Math.Max(0, (now.Date - issue.DueDate.Date).Days);

            issue.ReturnDate = now;
            issue.FineAmount = late * FinePerDay;
            await db.SaveChangesAsync();

            return Ok(new { issue.Id, issue.ReturnDate, daysOverdue = late, fine = issue.FineAmount });
        }
    }
}