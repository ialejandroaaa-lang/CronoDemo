-- 1. Create Promotions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Promociones')
BEGIN
    CREATE TABLE Promociones (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Codigo VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'SUMMER10'
        Nombre VARCHAR(100) NOT NULL,
        Tipo VARCHAR(20) NOT NULL, -- 'PERCENT', 'AMOUNT'
        Valor DECIMAL(18,2) NOT NULL,
        MinCompra DECIMAL(18,2) DEFAULT 0,
        FechaInicio DATETIME NULL,
        FechaFin DATETIME NULL,
        Activo BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END

-- 2. Add Discount Columns to VentasMaster
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasMaster') AND name = 'DescuentoTotal')
BEGIN
    ALTER TABLE VentasMaster ADD DescuentoTotal DECIMAL(18,2) NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasMaster') AND name = 'CodigoPromocion')
BEGIN
    ALTER TABLE VentasMaster ADD CodigoPromocion VARCHAR(50) NULL;
END

-- 3. Add Discount Columns to VentasDetalle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasDetalle') AND name = 'DescuentoMonto')
BEGIN
    ALTER TABLE VentasDetalle ADD DescuentoMonto DECIMAL(18,2) NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasDetalle') AND name = 'DescuentoPorcentaje')
BEGIN
    ALTER TABLE VentasDetalle ADD DescuentoPorcentaje DECIMAL(18,2) NOT NULL DEFAULT 0; -- Stored as 0-100 or 0-1? 0-100 usually easier for UI. Let's say 10 = 10%
END

-- 4. Insert Sample Data
IF NOT EXISTS (SELECT * FROM Promociones WHERE Codigo = 'WELCOME')
BEGIN
    INSERT INTO Promociones (Codigo, Nombre, Tipo, Valor, MinCompra, Activo)
    VALUES ('WELCOME', 'Bono de Bienvenida', 'AMOUNT', 100.00, 500.00, 1);
END
