-- AddMissingColumnsToVentasMaster.sql
-- Date: 2025-12-25
-- Description: Adds the columns that the VentasController expects but are missing
--              from the VentasMaster table.

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'VentasMaster')
BEGIN
    -- 1. DescuentoTotal (decimal, default 0)
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('VentasMaster') 
                     AND name = 'DescuentoTotal')
    BEGIN
        ALTER TABLE VentasMaster
        ADD DescuentoTotal DECIMAL(18,2) NULL DEFAULT 0;
        PRINT 'Columna DescuentoTotal agregada';
    END

    -- 2. CodigoPromocion (nvarchar(50), nullable)
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('VentasMaster') 
                     AND name = 'CodigoPromocion')
    BEGIN
        ALTER TABLE VentasMaster
        ADD CodigoPromocion NVARCHAR(50) NULL;
        PRINT 'Columna CodigoPromocion agregada';
    END

    -- 3. TerminosPago (nvarchar(200), nullable)
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('VentasMaster') 
                     AND name = 'TerminosPago')
    BEGIN
        ALTER TABLE VentasMaster
        ADD TerminosPago NVARCHAR(200) NULL;
        PRINT 'Columna TerminosPago agregada';
    END

    -- 4. Saldo (decimal, default 0)
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('VentasMaster') 
                     AND name = 'Saldo')
    BEGIN
        ALTER TABLE VentasMaster
        ADD Saldo DECIMAL(18,2) NULL DEFAULT 0;
        PRINT 'Columna Saldo agregada';
    END

    -- 5. FechaVencimiento (datetime, nullable)
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('VentasMaster') 
                     AND name = 'FechaVencimiento')
    BEGIN
        ALTER TABLE VentasMaster
        ADD FechaVencimiento DATETIME NULL;
        PRINT 'Columna FechaVencimiento agregada';
    END

    PRINT 'Todas las columnas faltantes fueron añadidas (si no existían).';
END
ELSE
BEGIN
    PRINT 'ERROR: La tabla VentasMaster no existe.';
END
GO
