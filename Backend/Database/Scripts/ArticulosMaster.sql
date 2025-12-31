-- Tabla Maestra de Artículos (ArticulosMaster)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ArticulosMaster]') AND type in (N'U'))
BEGIN
    CREATE TABLE ArticulosMaster (
        Id INT PRIMARY KEY IDENTITY(1,1),
        NumeroArticulo NVARCHAR(50) NOT NULL UNIQUE,
        CodigoBarras NVARCHAR(100) NULL,
        Descripcion NVARCHAR(255) NOT NULL,
        
        -- Clasificación
        GrupoProducto NVARCHAR(50) NULL,
        Categoria NVARCHAR(100) NULL,
        Marca NVARCHAR(100) NULL,
        Tipo NVARCHAR(100) NULL,
        
        -- Inventario
        UnidadMedida NVARCHAR(20) NOT NULL DEFAULT 'UND',
        AlmacenPrincipal NVARCHAR(50) NULL,
        UbicacionAlmacen NVARCHAR(50) NULL,
        
        -- Costos y Precios
        MetodoCosteo NVARCHAR(20) DEFAULT 'Promedio', -- FIFO, LIFO, Promedio, Estándar
        CostoUnitario DECIMAL(18, 2) DEFAULT 0,
        MargenPorcentaje DECIMAL(18, 4) DEFAULT 0,
        PrecioUnitario DECIMAL(18, 2) DEFAULT 0,
        NivelPrecio NVARCHAR(50) NULL,
        GrupoImpuesto NVARCHAR(50) NULL,
        
        -- Reposición
        SistemaReposicion NVARCHAR(20) DEFAULT 'Compra', -- Compra, Prod. Orden
        StockSeguridad DECIMAL(18, 2) DEFAULT 0,
        PuntoPedido DECIMAL(18, 2) DEFAULT 0,
        ProveedorPrincipal NVARCHAR(100) NULL,
        
        -- Estado
        Bloqueado BIT DEFAULT 0,
        ImagenUrl NVARCHAR(500) NULL,
        
        -- Auditoría
        Activo BIT DEFAULT 1, -- Para borrado lógico
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE(),
        UsuarioCreacion NVARCHAR(100) NULL
    );

    -- Índices para búsqueda rápida
    CREATE INDEX IX_ArticulosMaster_CodigoBarras ON ArticulosMaster(CodigoBarras);
    CREATE INDEX IX_ArticulosMaster_Descripcion ON ArticulosMaster(Descripcion);
    CREATE INDEX IX_ArticulosMaster_Grupo ON ArticulosMaster(GrupoProducto);
END
GO
