using System.ComponentModel.DataAnnotations;

namespace BMS.Models
{
    public class Member
    {
        public int ID { get; set; }

        [Required]
        public string NIC { get; set; } = "";

        [Required]
        public string Name { get; set; } = "";

        public string? Phone { get; set; }
        public string? Email { get; set; }
        public DateTime JoinedDate { get; set; } = DateTime.Now;
    }
}