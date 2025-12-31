using System.Collections.Generic;

namespace PosCrono.API.DTOs
{
    public class CartDto
    {
        public decimal Total { get; set; }
        public List<CartItemDto> Items { get; set; }
        public int? ClientId { get; set; }
        public string? CouponCode { get; set; }
        public string? ApplyTo { get; set; } // 'POS' or 'Distribution'
    }

    public class CartItemDto 
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal Price { get; set; }
        public string? Category { get; set; }
    }

    public class CartCalculationResult
    {
        public decimal OriginalTotal { get; set; }
        public decimal DiscountTotal { get; set; }
        public decimal FinalTotal { get; set; }
        public List<string> AppliedPromotions { get; set; } = new List<string>();
    }
}
