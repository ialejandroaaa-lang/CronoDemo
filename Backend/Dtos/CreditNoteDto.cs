using System;

namespace PosCrono.API.Dtos
{
    public class CreditNoteDto
    {
        public int? Id { get; set; }
        public int ClienteId { get; set; }
        public string? ClienteNombre { get; set; }
        public int? VentaOrigenId { get; set; }
        public int? ReturnId { get; set; }
        public string? NCF { get; set; }
        public decimal Monto { get; set; }
        public decimal Saldo { get; set; }
        public DateTime? Fecha { get; set; }
        public string? Estado { get; set; }
        public string? Concepto { get; set; }
    }
}
