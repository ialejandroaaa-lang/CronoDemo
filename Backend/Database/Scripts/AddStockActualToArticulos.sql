USE CRONODEMO;
GO

IF NOT EXISTS(SELECT * FROM sys.columns 
            WHERE Name = N'StockActual' AND Object_ID = Object_ID(N'ArticulosMaster'))
BEGIN
    ALTER TABLE ArticulosMaster
    ADD StockActual DECIMAL(18, 4) NOT NULL DEFAULT 0;
    
    PRINT 'Columna StockActual agregada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La columna StockActual ya existe.';
END
GO
