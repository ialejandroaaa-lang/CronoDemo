-- AddMissingColumnsToVentasDetalle.sql
-- Date: 2025-12-25
-- Description: Adds the missing column required by VentasController for the VentasDetalle table.

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'VentasDetalle')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('VentasDetalle') 
                     AND name = 'DescuentoMonto')
    BEGIN
        ALTER TABLE VentasDetalle
        ADD DescuentoMonto DECIMAL(18,2) NULL DEFAULT 0;
        PRINT 'Columna DescuentoMonto agregada a VentasDetalle';
    END
    ELSE
    BEGIN
        PRINT 'Columna DescuentoMonto ya existe en VentasDetalle';
    END
END
ELSE
BEGIN
    PRINT 'ERROR: La tabla VentasDetalle no existe.';
END
GO
