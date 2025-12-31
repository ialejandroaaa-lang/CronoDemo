
-- 1. Returns Master Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReturnsMaster')
BEGIN
    CREATE TABLE ReturnsMaster (
        Id INT PRIMARY KEY IDENTITY(1,1),
        VentaId INT NOT NULL, -- Link to Original Sale
        Fecha DATETIME DEFAULT GETDATE(),
        Estado NVARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Completado, Anulado
        Razon NVARCHAR(200),
        TipoAccion NVARCHAR(50), -- Reembolso, Credito, Cambio
        TotalReembolsado DECIMAL(18,2),
        Usuario NVARCHAR(100),
        FOREIGN KEY (VentaId) REFERENCES VentasMaster(Id)
    );
    PRINT 'ReturnsMaster table created.';
END

-- 2. Returns Detail Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReturnsDetail')
BEGIN
    CREATE TABLE ReturnsDetail (
        Id INT PRIMARY KEY IDENTITY(1,1),
        ReturnId INT NOT NULL,
        ArticuloId INT NOT NULL,
        Cantidad DECIMAL(18,2),
        PrecioUnitario DECIMAL(18,2),
        RetornarAlStock BIT DEFAULT 1, -- If true, stock is incremented
        FOREIGN KEY (ReturnId) REFERENCES ReturnsMaster(Id),
        FOREIGN KEY (ArticuloId) REFERENCES ArticulosMaster(Id)
    );
    PRINT 'ReturnsDetail table created.';
END

-- 3. Credit Notes Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CreditNotes')
BEGIN
    CREATE TABLE CreditNotes (
        Id INT PRIMARY KEY IDENTITY(1,1),
        ClienteId INT NOT NULL,
        VentaOrigenId INT NULL, -- Optional link to original invoice
        ReturnId INT NULL,      -- Optional link to a specific Return
        NCF NVARCHAR(50),       -- The B04... number
        Monto DECIMAL(18,2) NOT NULL,
        Saldo DECIMAL(18,2) NOT NULL, -- Remaining balance to be used
        Fecha DATETIME DEFAULT GETDATE(),
        Usuario NVARCHAR(100),
        Estado NVARCHAR(50) DEFAULT 'Activo', -- Activo, Usado, Anulado
        Concepto NVARCHAR(255),
        FOREIGN KEY (ClienteId) REFERENCES Clients(Id),
        FOREIGN KEY (ReturnId) REFERENCES ReturnsMaster(Id)
    );
    PRINT 'CreditNotes table created.';
END

-- 4. Ensure NCF Type 04 (Nota de Crédito) exists
IF NOT EXISTS (SELECT * FROM NCF_Secuencias WHERE TipoNCF = '04')
BEGIN
    INSERT INTO NCF_Secuencias (TipoNCF, Nombre, Prefijo, Desde, Actual, Hasta, Activo)
    VALUES ('04', 'Nota de Crédito', 'B04', 1, 0, 99999999, 1);
    PRINT 'NCF Type 04 inserted.';
END
ELSE
BEGIN
    PRINT 'NCF Type 04 already exists.';
END
