-- Script para agregar columnas de método de pago a VentasMaster
-- Fecha: 2025-12-20
-- Descripción: Agregar columnas para registrar método de pago, monto recibido y cambio

-- Verificar si la tabla existe
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'VentasMaster')
BEGIN
    -- Agregar columna MetodoPago si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasMaster') AND name = 'MetodoPago')
    BEGIN
        ALTER TABLE VentasMaster
        ADD MetodoPago NVARCHAR(50) NULL DEFAULT 'Efectivo';
        
        PRINT 'Columna MetodoPago agregada exitosamente';
    END
    ELSE
    BEGIN
        PRINT 'Columna MetodoPago ya existe';
    END

    -- Agregar columna MontoRecibido si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasMaster') AND name = 'MontoRecibido')
    BEGIN
        ALTER TABLE VentasMaster
        ADD MontoRecibido DECIMAL(18,2) NULL;
        
        PRINT 'Columna MontoRecibido agregada exitosamente';
    END
    ELSE
    BEGIN
        PRINT 'Columna MontoRecibido ya existe';
    END

    -- Agregar columna Cambio si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasMaster') AND name = 'Cambio')
    BEGIN
        ALTER TABLE VentasMaster
        ADD Cambio DECIMAL(18,2) NULL DEFAULT 0;
        
        PRINT 'Columna Cambio agregada exitosamente';
    END
    ELSE
    BEGIN
        PRINT 'Columna Cambio ya existe';
    END

    -- Actualizar registros existentes con valores por defecto
    UPDATE VentasMaster
    SET MetodoPago = 'Efectivo'
    WHERE MetodoPago IS NULL;

    UPDATE VentasMaster
    SET MontoRecibido = Total
    WHERE MontoRecibido IS NULL;

    UPDATE VentasMaster
    SET Cambio = 0
    WHERE Cambio IS NULL;

    PRINT 'Migración completada exitosamente';
END
ELSE
BEGIN
    PRINT 'ERROR: La tabla VentasMaster no existe';
END

