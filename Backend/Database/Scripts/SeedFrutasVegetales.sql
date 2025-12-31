USE CRONODEMO;
GO

-- Helper variables
DECLARE @Fecha DATETIME = GETDATE();

-- Temporary table for items
DECLARE @Items TABLE (
    Codigo VARCHAR(20),
    Descripcion VARCHAR(100),
    Unidad VARCHAR(5),
    Costo DECIMAL(18,2),
    Precio DECIMAL(18,2),
    ImagenUrl VARCHAR(255)
);

INSERT INTO @Items VALUES
('FV-001', 'Plátano Verde', 'UND', 15.00, 25.00, ''),
('FV-002', 'Guineo Maduro', 'UND', 5.00, 8.00, ''),
('FV-003', 'Yuca Mocana', 'LB', 20.00, 35.00, ''),
('FV-004', 'Batata', 'LB', 18.00, 30.00, ''),
('FV-005', 'Papa Granola', 'LB', 25.00, 45.00, ''),
('FV-006', 'Cebolla Roja', 'LB', 40.00, 75.00, ''),
('FV-007', 'Ajo Importado', 'LB', 80.00, 150.00, ''),
('FV-008', 'Ají Morrón Rojo', 'LB', 60.00, 110.00, ''),
('FV-009', 'Ají Cubanela', 'LB', 35.00, 65.00, ''),
('FV-010', 'Tomate Barceló', 'LB', 30.00, 55.00, ''),
('FV-011', 'Tomate Bugalu', 'LB', 25.00, 45.00, ''),
('FV-012', 'Lechuga Repollada', 'UND', 50.00, 90.00, ''),
('FV-013', 'Zanahoria', 'LB', 22.00, 40.00, ''),
('FV-014', 'Brocoli', 'LB', 45.00, 85.00, ''),
('FV-015', 'Coliflor', 'LB', 50.00, 95.00, ''),
('FV-016', 'Aguacate Seminole', 'UND', 40.00, 80.00, ''),
('FV-017', 'Limón Persa', 'UND', 10.00, 20.00, ''),
('FV-018', 'Naranja Dulce', 'UND', 12.00, 25.00, ''),
('FV-019', 'Piña', 'UND', 60.00, 120.00, ''),
('FV-020', 'Sandía', 'UND', 150.00, 300.00, '');

-- Cursor to iterate items
DECLARE @Codigo VARCHAR(20), @Desc VARCHAR(100), @Unidad VARCHAR(5), @Costo DECIMAL(18,2), @Precio DECIMAL(18,2), @Img VARCHAR(255);
DECLARE @ArticuloId INT;

DECLARE db_cursor CURSOR FOR SELECT Codigo, Descripcion, Unidad, Costo, Precio, ImagenUrl FROM @Items;
OPEN db_cursor;
FETCH NEXT FROM db_cursor INTO @Codigo, @Desc, @Unidad, @Costo, @Precio, @Img;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Insert ArticuloMaster if not exists
    IF NOT EXISTS (SELECT 1 FROM ArticulosMaster WHERE NumeroArticulo = @Codigo)
    BEGIN
        INSERT INTO ArticulosMaster (
            NumeroArticulo, CodigoBarras, Descripcion, 
            GrupoProducto, Categoria, Marca, Tipo, 
            UnidadMedida, AlmacenPrincipal, MetodoCosteo, 
            CostoUnitario, MargenPorcentaje, PrecioUnitario, 
            NivelPrecio, GrupoImpuesto, Activo, 
            FechaCreacion, UsuarioCreacion, PlanMedida, CostoEstandar, ImagenUrl
        ) VALUES (
            @Codigo, @Codigo, @Desc, 
            'Alimentos', 'Frutas y Vegetales', 'Local', 'Inventariable', 
            @Unidad, 1, 'Promedio', 
            @Costo, 0, @Precio, 
            'Precio al Detalle', 'ITBIS 18%', 1, 
            @Fecha, 'Sistema', NULL, @Costo, @Img
        );
        
        SET @ArticuloId = SCOPE_IDENTITY();

        -- Insert Price: Detalle
        INSERT INTO ArticulosPrecios (
            ArticuloId, NivelPrecio, UnidadMedida, CantidadInicial, 
            Porcentaje, Precio, Moneda, Activo
        ) VALUES (
            @ArticuloId, 'Precio al Detalle', @Unidad, 0, 
            0, @Precio, 'DOP', 1
        );

        -- Insert Price: Mayorista (Example Logic: 10% less, Min Qty 10)
        INSERT INTO ArticulosPrecios (
            ArticuloId, NivelPrecio, UnidadMedida, CantidadInicial, 
            Porcentaje, Precio, Moneda, Activo
        ) VALUES (
            @ArticuloId, 'Precio al Mayoreo', @Unidad, 10, 
            0, @Precio * 0.90, 'DOP', 1
        );
    END

    FETCH NEXT FROM db_cursor INTO @Codigo, @Desc, @Unidad, @Costo, @Precio, @Img;
END

CLOSE db_cursor;
DEALLOCATE db_cursor;

SELECT 'Seeding Completed' as Status;
GO
