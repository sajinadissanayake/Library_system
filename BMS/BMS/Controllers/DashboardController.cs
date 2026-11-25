using BMS.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly BookDbContext db;
        public DashboardController(BookDbContext context) { db = context; }

        [HttpGet("GetStats")]
        public async Task<IActionResult> GetStats()
        {
            var totalBooks = await db.Books.SumAsync(b => (int?)b.Quantity) ?? 0;
            var totalTitles = await db.Books.CountAsync();
            var totalMembers = await db.Members.CountAsync();

            var borrowed = await db.Issues.CountAsync(i => i.ReturnDate == null);
            var overdue = await db.Issues.CountAsync(i => i.ReturnDate == null && i.DueDate < DateTime.Today);

            return Ok(new
            {
                totalTitles,
                totalBooks,
                totalMembers,
                availableBooks = totalBooks - borrowed,
                borrowedBooks = borrowed,
                overdueBooks = overdue
            });
        }
    }
}