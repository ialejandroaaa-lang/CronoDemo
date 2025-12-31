USE CRONODEMO;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NivelesPrecio')
BEGIN
    CREATE TABLE NivelesPrecio (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL UNIQUE,
        Descripcion NVARCHAR(100),
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );

    -- Insert Default Levels
    INSERT INTO NivelesPrecio (Nombre, Descripcion) values ('Detalle', 'Precio al consumidor final');
    INSERT INTO NivelesPrecio (Nombre, Descripcion) values ('Mayoreo', 'Precio para compras por volumen');
    INSERT INTO NivelesPrecio (Nombre, Descripcion) values ('Distribuidor', 'Precio especial para distribuidores');
END
GO
