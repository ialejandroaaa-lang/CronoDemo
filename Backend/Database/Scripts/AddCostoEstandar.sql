USE CRONODEMO;
GO

IF NOT EXISTS(SELECT * FROM sys.columns 
            WHERE Name = N'CostoEstandar' AND Object_ID = Object_ID(N'ArticulosMaster'))
BEGIN
    ALTER TABLE ArticulosMaster
    ADD CostoEstandar DECIMAL(18, 4) NOT NULL DEFAULT 0;
    PRINT 'Columna CostoEstandar agregada.';
END
GO

-- Separate batch for update
UPDATE ArticulosMaster SET CostoEstandar = CostoUnitario WHERE CostoEstandar = 0;
GO
