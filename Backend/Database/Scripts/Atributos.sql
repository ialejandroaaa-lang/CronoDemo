-- Categorias
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categorias]') AND type in (N'U'))
BEGIN
    CREATE TABLE Categorias (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Codigo NVARCHAR(20) NOT NULL UNIQUE,
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        Activo BIT DEFAULT 1
    );
END
GO

-- Marcas
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Marcas]') AND type in (N'U'))
BEGIN
    CREATE TABLE Marcas (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Codigo NVARCHAR(20) NOT NULL UNIQUE,
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        Activo BIT DEFAULT 1
    );
END
GO

-- Tipos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tipos]') AND type in (N'U'))
BEGIN
    CREATE TABLE Tipos (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Codigo NVARCHAR(20) NOT NULL UNIQUE,
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        Activo BIT DEFAULT 1
    );
END
GO
