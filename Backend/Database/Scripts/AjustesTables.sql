IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AjustesMaster' AND xtype='U')
BEGIN
    CREATE TABLE AjustesMaster (
        Id INT PRIMARY KEY IDENTITY(1,1),
        NumeroDocumento NVARCHAR(50) NOT NULL,
        Fecha DATETIME NOT NULL,
        TipoAjuste NVARCHAR(10) NOT NULL, -- 'in' / 'out'
        MotivoId INT NOT NULL,
        AlmacenId INT NOT NULL,
        Observaciones NVARCHAR(500),
        Usuario NVARCHAR(100),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        Estado NVARCHAR(20) DEFAULT 'Completado'
    );
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AjustesDetalle' AND xtype='U')
BEGIN
    CREATE TABLE AjustesDetalle (
        Id INT PRIMARY KEY IDENTITY(1,1),
        AjusteId INT FOREIGN KEY REFERENCES AjustesMaster(Id),
        ArticuloId INT NOT NULL,
        Cantidad DECIMAL(18,4) NOT NULL, -- Quantity entered (e.g. 5 boxes)
        UnidadMedida NVARCHAR(20), -- Unit entered (e.g. 'BOX')
        CostoUnitario DECIMAL(18,2), -- Cost per base unit
        CantidadUnidad DECIMAL(18,4), -- Base units per unit entered (e.g. 12)
        PlanUoM NVARCHAR(50), -- Plan ID if applicable
        TotalUnidades DECIMAL(18,4) -- Total base units (5 * 12 = 60)
    );
END

-- Ensure AJUSTE sequence exists
IF NOT EXISTS (SELECT * FROM DocumentSequences WHERE Code = 'AJUSTE')
BEGIN
    INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length, LastModified)
    VALUES ('AJUSTE', 'Ajuste de Inventario', 'AJ-', 0, 6, GETDATE());
END
