IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotasMaster')
BEGIN
    CREATE TABLE NotasMaster (
        Id INT PRIMARY KEY IDENTITY(1,1),
        ProveedorId INT NOT NULL,
        Tipo NVARCHAR(20) NOT NULL, -- 'Credito', 'Debito'
        Fecha DATETIME DEFAULT GETDATE(),
        MonedaId INT NOT NULL,
        TasaCambio DECIMAL(18,4) DEFAULT 1.0,
        Monto DECIMAL(18,2) NOT NULL,
        MontoFuncional DECIMAL(18,2) NOT NULL,
        Referencia NVARCHAR(50),
        Comentario NVARCHAR(200),
        Estado NVARCHAR(20) DEFAULT 'Completada', -- 'Completada', 'Anulada'
        FOREIGN KEY (ProveedorId) REFERENCES ProveedoresMaster(Id),
        FOREIGN KEY (MonedaId) REFERENCES Monedas(Id)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotasDetalle')
BEGIN
    CREATE TABLE NotasDetalle (
        Id INT PRIMARY KEY IDENTITY(1,1),
        NotaId INT NOT NULL,
        CompraId INT NOT NULL, -- La factura que se afecta
        MontoAplicado DECIMAL(18,2) NOT NULL,
        MontoAplicadoFuncional DECIMAL(18,2) NOT NULL,
        FOREIGN KEY (NotaId) REFERENCES NotasMaster(Id),
        FOREIGN KEY (CompraId) REFERENCES ComprasMaster(Id)
    );
END
