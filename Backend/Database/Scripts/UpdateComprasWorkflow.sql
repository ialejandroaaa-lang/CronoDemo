USE CRONODEMO;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND name = 'TipoDocumento')
BEGIN
    ALTER TABLE [dbo].[ComprasMaster] ADD [TipoDocumento] NVARCHAR(20) NOT NULL DEFAULT 'Factura';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasMaster]') AND name = 'DocumentoReferenciaId')
BEGIN
    ALTER TABLE [dbo].[ComprasMaster] ADD [DocumentoReferenciaId] INT NULL;
END
GO
