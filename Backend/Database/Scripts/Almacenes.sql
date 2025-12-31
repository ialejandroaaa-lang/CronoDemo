IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Almacenes]') AND type in (N'U'))
BEGIN
    CREATE TABLE Almacenes (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Codigo NVARCHAR(20) NOT NULL UNIQUE,
        Nombre NVARCHAR(100) NOT NULL,
        Direccion NVARCHAR(255) NULL,
        Ciudad NVARCHAR(100) NULL,
        Activo BIT DEFAULT 1
    );

    -- Seed Data
    INSERT INTO Almacenes (Codigo, Nombre, Direccion, Ciudad, Activo)
    VALUES 
    ('ALM-001', 'Almacén Principal', 'Av. 27 de Febrero #100', 'Santo Domingo', 1),
    ('ALM-002', 'Sucursal Norte', 'Carr. Santiago #50', 'Santiago', 1),
    ('ALM-003', 'Depósito Zona Este', 'Av. Punta Cana', 'Bávaro', 1),
    ('ALM-004', 'Tienda Centro', 'Calle El Conde', 'Santo Domingo', 1),
    ('ALM-005', 'Almacén de Tránsito', 'Puerto Haina', 'Haina', 1);
END
GO
