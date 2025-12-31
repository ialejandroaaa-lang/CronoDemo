-- 1. Create VentasMaster
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VentasMaster' AND xtype='U')
BEGIN
    CREATE TABLE VentasMaster (
        Id INT PRIMARY KEY IDENTITY(1,1),
        NumeroFactura NVARCHAR(50) NOT NULL UNIQUE,
        Fecha DATETIME NOT NULL DEFAULT GETDATE(),
        ClienteId INT NOT NULL,
        NCF NVARCHAR(50),
        TipoNCF NVARCHAR(20),
        Subtotal DECIMAL(18,2) NOT NULL,
        ITBIS DECIMAL(18,2) NOT NULL,
        Total DECIMAL(18,2) NOT NULL,
        AlmacenId INT NOT NULL,
        Usuario NVARCHAR(100),
        Estado NVARCHAR(20) DEFAULT 'Completado',
        CONSTRAINT FK_Ventas_Client FOREIGN KEY (ClienteId) REFERENCES Clients(Id),
        CONSTRAINT FK_Ventas_Almacen FOREIGN KEY (AlmacenId) REFERENCES Almacenes(Id)
    );
END

-- 2. Create VentasDetalle
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VentasDetalle' AND xtype='U')
BEGIN
    CREATE TABLE VentasDetalle (
        Id INT PRIMARY KEY IDENTITY(1,1),
        VentaId INT NOT NULL,
        ArticuloId INT NOT NULL,
        Cantidad DECIMAL(18,4) NOT NULL,
        PrecioUnitario DECIMAL(18,2) NOT NULL,
        ITBIS DECIMAL(18,2) NOT NULL,
        TotalLinea DECIMAL(18,2) NOT NULL,
        AlmacenId INT NOT NULL,
        CONSTRAINT FK_VentasDetalle_Master FOREIGN KEY (VentaId) REFERENCES VentasMaster(Id),
        CONSTRAINT FK_VentasDetalle_Articulo FOREIGN KEY (ArticuloId) REFERENCES ArticulosMaster(Id)
    );
END

-- 3. Create NCF_Secuencias
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NCF_Secuencias' AND xtype='U')
BEGIN
    CREATE TABLE NCF_Secuencias (
        Id INT PRIMARY KEY IDENTITY(1,1),
        TipoNCF NVARCHAR(20) NOT NULL,
        Nombre NVARCHAR(100),
        Prefijo NVARCHAR(10) NOT NULL,
        Desde INT NOT NULL,
        Hasta INT NOT NULL,
        Actual INT NOT NULL,
        Activo BIT DEFAULT 1
    );

    INSERT INTO NCF_Secuencias (TipoNCF, Nombre, Prefijo, Desde, Hasta, Actual, Activo)
    VALUES 
    ('B01', 'Factura de Crédito Fiscal', 'B01', 1, 1000, 0, 1),
    ('B02', 'Factura de Consumo', 'B02', 1, 10000, 0, 1);
END
