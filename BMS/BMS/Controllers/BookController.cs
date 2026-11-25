using BMS.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly BookDbContext db;

        public BookController (BookDbContext context)
        {
            db = context;
        }

        [HttpGet("GetBooks")]
        public async Task<IEnumerable<Book>> GetBooks()
        {
            var books = await db.Books.ToListAsync();
            var counts = await db.Issues
                .Where(i => i.ReturnDate == null)
                .GroupBy(i => i.BookId)
                .Select(g => new { BookId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.BookId, x => x.Count);

            foreach (var b in books)
                b.Available = b.Quantity - (counts.TryGetValue(b.Id, out var c) ? c : 0);

            return books;
        }

        [HttpPost("AddBook")]
        public async Task<Book> AddBook(Book obj)
        {
            db.Books.Add(obj);
            await db.SaveChangesAsync();
            return obj;
        }


        [HttpPatch("UpdateBook/{id}")]
        public async Task<IActionResult> UpdateBook(int id, Book obj)
        {
            var existingBook = await db.Books.FindAsync(id);
            if (existingBook == null) return NotFound(new { message = "Book not found." });

            var issued = await db.Issues.CountAsync(i => i.BookId == id && i.ReturnDate == null);
            if (obj.Quantity < issued)
                return BadRequest(new { message = $"{issued} copies are currently borrowed. Quantity cannot be lower." });

            existingBook.Title = obj.Title;
            existingBook.Publisher = obj.Publisher;
            existingBook.Author = obj.Author;
            existingBook.Year = obj.Year;
            existingBook.Quantity = obj.Quantity;

            await db.SaveChangesAsync();
            return Ok(existingBook);
        }


        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await db.Books.FindAsync(id);
            if (book == null) return NotFound(new { message = "Book not found." });

            if (await db.Issues.AnyAsync(i => i.BookId == id && i.ReturnDate == null))
                return BadRequest(new { message = "This book is currently borrowed." });

            db.Books.Remove(book);
            await db.SaveChangesAsync();
            return Ok(true);
        }

    }
}
