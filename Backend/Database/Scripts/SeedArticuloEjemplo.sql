USE CRONODEMO;
GO

IF NOT EXISTS (SELECT 1 FROM ArticulosMaster WHERE NumeroArticulo = 'HER-001')
BEGIN
    INSERT INTO ArticulosMaster (
        NumeroArticulo, 
        CodigoBarras, 
        Descripcion, 
        GrupoProducto, 
        Categoria, 
        Marca, 
        Tipo, 
        UnidadMedida, 
        AlmacenPrincipal, 
        UbicacionAlmacen, 
        MetodoCosteo, 
        CostoUnitario, 
        MargenPorcentaje, 
        PrecioUnitario, 
        NivelPrecio, 
        GrupoImpuesto, 
        SistemaReposicion, 
        StockSeguridad, 
        PuntoPedido, 
        ProveedorPrincipal, 
        Bloqueado, 
        Activo, 
        UsuarioCreacion,
        FechaCreacion
    ) VALUES (
        'HER-001', 
        '7451234567890', 
        'Taladro Percutor Inalámbrico 20V Brushless', 
        'Herramientas', 
        'Herramientas Eléctricas', 
        'DeWalt', 
        'Inalámbrico', 
        'UND', 
        'PRINCIPAL', 
        'P-05-B', 
        'Promedio', 
        120.00, 
        35.00, 
        162.00, 
        'General', 
        'IVA 19%', 
        'Automático', 
        5.00, 
        10.00, 
        'Herramientas Industriales SA', 
        0, 
        1, 
        'Sistema',
        GETDATE()
    );
END
GO

SELECT * FROM ArticulosMaster WHERE NumeroArticulo = 'HER-001';
