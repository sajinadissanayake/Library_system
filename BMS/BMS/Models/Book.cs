using System.ComponentModel.DataAnnotations.Schema;

namespace BMS.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Author { get; set; }
        public string Publisher { get; set; }
        public int Year { get; set; }
        public int Quantity { get; set; }

        [NotMapped]
        public int Available { get; set; }
    }
}