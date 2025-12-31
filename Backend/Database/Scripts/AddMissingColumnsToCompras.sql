USE CRONODEMO;
GO

-- Add missing columns to ComprasMaster
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND name = 'AlmacenId')
BEGIN
    ALTER TABLE [dbo].[ComprasMaster] ADD [AlmacenId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND name = 'MonedaId')
BEGIN
    ALTER TABLE [dbo].[ComprasMaster] ADD [MonedaId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND name = 'TasaCambio')
BEGIN
    ALTER TABLE [dbo].[ComprasMaster] ADD [TasaCambio] DECIMAL(18, 4) NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND name = 'Saldo')
BEGIN
    ALTER TABLE [dbo].[ComprasMaster] ADD [Saldo] DECIMAL(18, 2) NOT NULL DEFAULT 0;
END
GO

-- Update Saldo for existing completed Facturas (optional but good for consistency)
UPDATE ComprasMaster 
SET Saldo = Total 
WHERE Saldo = 0 AND Estado = 'Completado' AND TipoDocumento = 'Factura';
GO
