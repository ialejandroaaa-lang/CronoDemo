namespace PosCrono.API.Models
{
    public class Almacen
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Direccion { get; set; }
        public string Ciudad { get; set; }
        public bool Activo { get; set; }
    }
}
