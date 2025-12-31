IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CotizacionesMaster')
BEGIN
    CREATE TABLE CotizacionesMaster (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NumeroCotizacion NVARCHAR(50) NOT NULL UNIQUE,
        Fecha DATETIME NOT NULL,
        ClienteId INT NOT NULL,
        AlmacenId INT NOT NULL,
        Usuario NVARCHAR(50),
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
        ITBIS DECIMAL(18,2) NOT NULL DEFAULT 0,
        Descuento DECIMAL(18,2) NOT NULL DEFAULT 0,
        Total DECIMAL(18,2) NOT NULL DEFAULT 0,
        MonedaId INT,
        TasaCambio DECIMAL(18,4) DEFAULT 1,
        Referencia NVARCHAR(200),
        TerminosPago NVARCHAR(50),
        Estado NVARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Aprobada, Cancelada
        FechaVencimiento DATETIME,
        Observaciones NVARCHAR(MAX)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CotizacionesDetalle')
BEGIN
    CREATE TABLE CotizacionesDetalle (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CotizacionId INT NOT NULL,
        ArticuloId INT NOT NULL,
        Cantidad DECIMAL(18,2) NOT NULL,
        PrecioUnitario DECIMAL(18,2) NOT NULL,
        ITBIS DECIMAL(18,2) NOT NULL DEFAULT 0,
        DescuentoMonto DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalLinea DECIMAL(18,2) NOT NULL,
        UnidadMedidaId NVARCHAR(20),
        AlmacenId INT,
        CONSTRAINT FK_CotizacionesDetalle_Master FOREIGN KEY (CotizacionId) REFERENCES CotizacionesMaster(Id) ON DELETE CASCADE
    );
END
