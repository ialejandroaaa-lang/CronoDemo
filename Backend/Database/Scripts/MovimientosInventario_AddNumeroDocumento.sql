IF EXISTS (SELECT * FROM sysobjects WHERE name='MovimientosInventario' AND xtype='U')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[MovimientosInventario]') AND name = 'NumeroDocumento')
    BEGIN
        ALTER TABLE MovimientosInventario ADD NumeroDocumento NVARCHAR(50) NULL
    END
END
