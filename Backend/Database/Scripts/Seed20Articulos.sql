USE CRONODEMO;
GO

-- Helper to insert if not exists
CREATE OR ALTER PROCEDURE dbo.InsertArticuloEjemplo
    @NumeroArticulo NVARCHAR(50),
    @Descripcion NVARCHAR(255),
    @Categoria NVARCHAR(100),
    @Precio DECIMAL(18,2),
    @Costo DECIMAL(18,2),
    @Stock DECIMAL(18,4),
    @Unidad NVARCHAR(20)
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ArticulosMaster WHERE NumeroArticulo = @NumeroArticulo)
    BEGIN
        INSERT INTO ArticulosMaster (
            NumeroArticulo, Descripcion, Categoria, 
            PrecioUnitario, CostoUnitario, StockActual, UnidadMedida,
            Activo, FechaCreacion, UsuarioCreacion, AlmacenPrincipal
        ) VALUES (
            @NumeroArticulo, @Descripcion, @Categoria,
            @Precio, @Costo, @Stock, @Unidad,
            1, GETDATE(), 'Seed', 'Principal'
        );
    END
END
GO

-- 1. Herramientas Manuales
EXEC dbo.InsertArticuloEjemplo 'HER-001', 'Martillo de Uña 16oz Mango Fibra', 'Herramientas', 250.00, 150.00, 50, 'UND';
EXEC dbo.InsertArticuloEjemplo 'HER-002', 'Destornillador Phillips #2 x 4"', 'Herramientas', 85.00, 45.00, 100, 'UND';
EXEC dbo.InsertArticuloEjemplo 'HER-003', 'Destornillador Plano 1/4 x 4"', 'Herramientas', 85.00, 45.00, 100, 'UND';
EXEC dbo.InsertArticuloEjemplo 'HER-004', 'Llave Ajustable 10 Cromada', 'Herramientas', 350.00, 200.00, 30, 'UND';
EXEC dbo.InsertArticuloEjemplo 'HER-005', 'Alicate Universal 8" Profesional', 'Herramientas', 280.00, 160.00, 40, 'UND';
EXEC dbo.InsertArticuloEjemplo 'HER-006', 'Serrucho de Costilla 12"', 'Herramientas', 320.00, 180.00, 25, 'UND';
EXEC dbo.InsertArticuloEjemplo 'HER-007', 'Cinta Métrica 5m/16ft', 'Herramientas', 120.00, 60.00, 80, 'UND';

-- 2. Materiales de Construcción
EXEC dbo.InsertArticuloEjemplo 'MAT-001', 'Cemento Gris Portland 42.5kg', 'Materiales', 450.00, 380.00, 500, 'SACO';
EXEC dbo.InsertArticuloEjemplo 'MAT-002', 'Arena Lavada (Metro Cúbico)', 'Materiales', 1200.00, 800.00, 50, 'M3';
EXEC dbo.InsertArticuloEjemplo 'MAT-003', 'Varilla Corrugada 3/8 x 20"', 'Materiales', 280.00, 220.00, 1000, 'UND';
EXEC dbo.InsertArticuloEjemplo 'MAT-004', 'Bloque de Concreto 6"', 'Materiales', 45.00, 32.00, 2000, 'UND';

-- 3. Pinturas y Acabados
EXEC dbo.InsertArticuloEjemplo 'PNT-001', 'Pintura Blanca Mate 1 Galón', 'Pinturas', 850.00, 550.00, 60, 'GLN';
EXEC dbo.InsertArticuloEjemplo 'PNT-002', 'Rodillo Felpa 9" con Mango', 'Pinturas', 150.00, 80.00, 100, 'UND';
EXEC dbo.InsertArticuloEjemplo 'PNT-003', 'Brocha Cerda Natural 2"', 'Pinturas', 60.00, 30.00, 150, 'UND';
EXEC dbo.InsertArticuloEjemplo 'PNT-004', 'Thinner Acrílico 1 Galón', 'Pinturas', 350.00, 200.00, 40, 'GLN';

-- 4. Eléctricos
EXEC dbo.InsertArticuloEjemplo 'ELE-001', 'Cable THHN #12 Rojo (Rollo 100m)', 'Eléctricos', 2800.00, 2100.00, 20, 'ROLLO';
EXEC dbo.InsertArticuloEjemplo 'ELE-002', 'Tomacorriente Doble Polarizado', 'Eléctricos', 75.00, 40.00, 200, 'UND';
EXEC dbo.InsertArticuloEjemplo 'ELE-003', 'Bombillo LED 9W Luz Día', 'Eléctricos', 95.00, 50.00, 300, 'UND';
EXEC dbo.InsertArticuloEjemplo 'ELE-004', 'Cinta Aislante 3M Negra', 'Eléctricos', 45.00, 25.00, 150, 'UND';
EXEC dbo.InsertArticuloEjemplo 'ELE-005', 'Interruptor Sencillo Blanco', 'Eléctricos', 65.00, 35.00, 180, 'UND';

-- Cleanup
DROP PROCEDURE dbo.InsertArticuloEjemplo;
GO
