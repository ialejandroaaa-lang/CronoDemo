namespace PosCrono.API.Models
{
    public class GrupoImpuesto
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public decimal Tasa { get; set; }
        public bool Activo { get; set; }
    }
}
