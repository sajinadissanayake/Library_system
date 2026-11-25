using BMS.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MemberController : ControllerBase
    {
        private readonly BookDbContext db;
        public MemberController(BookDbContext context) { db = context; }

        [HttpGet("GetMembers")]
        public async Task<IEnumerable<Member>> GetMembers()
        {
            return await db.Members.OrderBy(m => m.ID).ToListAsync();
        }

        [HttpPost("AddMember")]
        public async Task<IActionResult> AddMember(Member obj)
        {
            if (await db.Members.AnyAsync(m => m.NIC == obj.NIC))
                return BadRequest(new { message = "A member with this NIC already exists." });

            obj.ID = 0;
            obj.JoinedDate = DateTime.Now;
            db.Members.Add(obj);
            await db.SaveChangesAsync();
            return Ok(obj);
        }

        [HttpPatch("UpdateMember/{id}")]
        public async Task<IActionResult> UpdateMember(int id, Member obj)
        {
            var existing = await db.Members.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Member not found." });

            if (await db.Members.AnyAsync(m => m.NIC == obj.NIC && m.ID != id))
                return BadRequest(new { message = "Another member already uses this NIC." });

            existing.NIC = obj.NIC;
            existing.Name = obj.Name;
            existing.Phone = obj.Phone;
            existing.Email = obj.Email;

            await db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteMember(int id)
        {
            var member = await db.Members.FindAsync(id);
            if (member == null) return NotFound(new { message = "Member not found." });

            if (await db.Issues.AnyAsync(i => i.MemberId == id && i.ReturnDate == null))
                return BadRequest(new { message = "This member still has borrowed books." });

            db.Members.Remove(member);
            await db.SaveChangesAsync();
            return Ok(true);
        }
    }
}