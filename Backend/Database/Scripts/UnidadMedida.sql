
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UnidadMedidaPlan')
BEGIN
    CREATE TABLE UnidadMedidaPlan (
        Id INT IDENTITY(1,1),
        PlanId NVARCHAR(50) NOT NULL PRIMARY KEY,
        Descripcion NVARCHAR(100),
        UnidadBase NVARCHAR(20) NOT NULL,
        Decimales INT NOT NULL DEFAULT 0,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE()
    )
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UnidadMedidaPlanDetalle')
BEGIN
    CREATE TABLE UnidadMedidaPlanDetalle (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PlanId NVARCHAR(50) NOT NULL,
        UnidadMedida NVARCHAR(20) NOT NULL,
        Cantidad DECIMAL(18,5) NOT NULL,
        Equivalente NVARCHAR(20) NOT NULL,
        Orden INT DEFAULT 0,
        CONSTRAINT FK_UnidadMedidaPlanDetalle_Plan FOREIGN KEY (PlanId) REFERENCES UnidadMedidaPlan(PlanId) ON DELETE CASCADE
    )
END
GO
