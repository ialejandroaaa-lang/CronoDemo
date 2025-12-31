USE CRONODEMO;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GruposImpuestos]') AND type in (N'U'))
BEGIN
    CREATE TABLE GruposImpuestos (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Codigo NVARCHAR(20) NOT NULL UNIQUE,
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        Tasa DECIMAL(18,2) NOT NULL DEFAULT 0,
        Activo BIT DEFAULT 1
    );

    -- Seed Data
    INSERT INTO GruposImpuestos (Codigo, Nombre, Descripcion, Tasa, Activo)
    VALUES 
    ('ITBIS18', 'ITBIS 18%', 'Impuesto general sobre ventas', 18.00, 1),
    ('ITBIS16', 'ITBIS 16%', 'Tasa reducida', 16.00, 1),
    ('EXENTO', 'Exento', 'Productos exentos de impuesto', 0.00, 1),
    ('ITBIS0', 'ITBIS 0%', 'Tasa cero', 0.00, 1),
    ('ISC', 'Impuesto Selectivo', 'Impuesto Selectivo al Consumo', 10.00, 1);
END
GO
