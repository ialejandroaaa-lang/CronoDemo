-- CobrosMaster: Header for Collections
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CobrosMaster]') AND type in (N'U'))
BEGIN
    CREATE TABLE CobrosMaster (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NumeroCobro NVARCHAR(20) NOT NULL,
        ClienteId INT NOT NULL,
        Fecha DATETIME NOT NULL DEFAULT GETDATE(),
        Monto DECIMAL(18,2) NOT NULL,
        MetodoPago NVARCHAR(50) NOT NULL,
        Referencia NVARCHAR(100) NULL,
        MonedaId INT NULL,
        TasaCambio DECIMAL(18,4) DEFAULT 1,
        Observaciones NVARCHAR(MAX) NULL,
        Estado NVARCHAR(20) DEFAULT 'Completado',
        Usuario NVARCHAR(50) NULL,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END

-- CobrosDetalle: Allocations to Invoices
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CobrosDetalle]') AND type in (N'U'))
BEGIN
    CREATE TABLE CobrosDetalle (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CobroId INT NOT NULL,
        VentaId INT NOT NULL, -- Reference to VentasMaster
        MontoAplicado DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_CobrosDetalle_CobrosMaster FOREIGN KEY (CobroId) REFERENCES CobrosMaster(Id),
        CONSTRAINT FK_CobrosDetalle_VentasMaster FOREIGN KEY (VentaId) REFERENCES VentasMaster(Id)
    );
END

-- Sequence for Cobros
IF NOT EXISTS (SELECT * FROM DocumentSequences WHERE Code = 'PAYMENT_RECEIPT')
BEGIN
    INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length) 
    VALUES ('PAYMENT_RECEIPT', 'Recibo de Ingreso', 'RC-', 0, 6);
END
