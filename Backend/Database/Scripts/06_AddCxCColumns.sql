IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[VentasMaster]') AND name = 'Saldo')
BEGIN
    ALTER TABLE VentasMaster ADD Saldo decimal(18,2) NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[VentasMaster]') AND name = 'TerminosPago')
BEGIN
    ALTER TABLE VentasMaster ADD TerminosPago nvarchar(50) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[VentasMaster]') AND name = 'FechaVencimiento')
BEGIN
    ALTER TABLE VentasMaster ADD FechaVencimiento datetime NULL;
END
