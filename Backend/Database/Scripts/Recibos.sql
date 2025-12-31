-- Script para crear la tabla de Recibos y su Configuración
-- Fecha: 2025-12-21

-- 1. Tabla RecibosMaster (Detalles del cobro)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RecibosMaster')
BEGIN
    CREATE TABLE RecibosMaster (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        VentaId INT NOT NULL, -- Vinculada a la venta
        NumeroRecibo NVARCHAR(50) NOT NULL, -- Secuencia generada
        Fecha DATETIME DEFAULT GETDATE(),
        Monto DECIMAL(18,2) NOT NULL,
        MetodoPago NVARCHAR(50),
        Referencia NVARCHAR(100), -- Para cheques, transacciones, etc.
        Usuario NVARCHAR(50),
        Estado NVARCHAR(20) DEFAULT 'Activo', -- Activo, Anulado
        FechaCreacion DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT FK_Recibos_Ventas FOREIGN KEY (VentaId) REFERENCES VentasMaster(Id)
    );
END
GO

-- 2. Tabla ReciboConfiguration (Configuración de secuencia)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReciboConfiguration')
BEGIN
    CREATE TABLE ReciboConfiguration (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Prefijo NVARCHAR(10) DEFAULT 'REC', -- Ej: REC
        SecuenciaActual INT DEFAULT 0, -- Último número generado
        Longitud INT DEFAULT 6, -- Cantidad de dígitos (000001)
        UltimaFechaModificacion DATETIME DEFAULT GETDATE()
    );

    -- Insertar configuración por defecto
    INSERT INTO ReciboConfiguration (Prefijo, SecuenciaActual, Longitud)
    VALUES ('REC', 0, 6);
END
GO
