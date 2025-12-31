USE CRONODEMO;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ArticulosPrecios')
BEGIN
    CREATE TABLE ArticulosPrecios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ArticuloId INT NOT NULL,
        NivelPrecio NVARCHAR(50) NOT NULL,
        UnidadMedida NVARCHAR(20) NOT NULL,
        CantidadInicial DECIMAL(18, 4) DEFAULT 0,
        Porcentaje DECIMAL(18, 4) DEFAULT 0,
        Precio DECIMAL(18, 4) NOT NULL DEFAULT 0,
        Moneda NVARCHAR(10) NOT NULL DEFAULT 'USD',
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_ArticulosPrecios_Articulos FOREIGN KEY (ArticuloId) REFERENCES ArticulosMaster(Id) ON DELETE CASCADE
    );
END
GO
