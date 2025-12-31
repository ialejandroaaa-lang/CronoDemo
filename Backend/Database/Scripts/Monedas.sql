USE CRONODEMO;
GO

-- Tabla de Monedas
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Monedas')
BEGIN
    CREATE TABLE Monedas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Codigo NVARCHAR(3) NOT NULL UNIQUE, -- USD, EUR, DOP
        Nombre NVARCHAR(50) NOT NULL,
        Simbolo NVARCHAR(5) NOT NULL,
        EsFuncional BIT NOT NULL DEFAULT 0,
        Activo BIT NOT NULL DEFAULT 1
    );

    -- Insertar moneda base (DOP) si no existe
    IF NOT EXISTS (SELECT TOP 1 1 FROM Monedas)
    BEGIN
        INSERT INTO Monedas (Codigo, Nombre, Simbolo, EsFuncional) 
        VALUES ('DOP', 'Peso Dominicano', 'RD$', 1);
        
        INSERT INTO Monedas (Codigo, Nombre, Simbolo, EsFuncional) 
        VALUES ('USD', 'Dolar Estadounidense', 'US$', 0);
    END
END
GO

-- Tabla de Tasas de Cambio
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TasasCambio')
BEGIN
    CREATE TABLE TasasCambio (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        MonedaId INT NOT NULL,
        Tasa DECIMAL(18, 6) NOT NULL, -- Cuantos Pesos (Funcional) por 1 Unidad de Moneda Extranjera
        FechaInicio DATETIME NOT NULL,
        FechaFin DATETIME NULL, -- NULL significa vigente indefinidamente hasta nueva tasa
        
        CONSTRAINT FK_TasasCambio_Monedas FOREIGN KEY (MonedaId) REFERENCES Monedas(Id)
    );
    
    CREATE INDEX IX_TasasCambio_Fecha ON TasasCambio(FechaInicio);
END
GO
