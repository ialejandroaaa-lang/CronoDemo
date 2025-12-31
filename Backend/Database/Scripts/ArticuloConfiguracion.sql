-- Tabla para configuración general de artículos
CREATE TABLE ArticuloConfiguracion (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Prefijo NVARCHAR(10) NULL,
    SiguienteNumero NVARCHAR(20) NOT NULL DEFAULT '00001',
    LongitudMinima INT NOT NULL DEFAULT 5,
    PermitirEdicion BIT NOT NULL DEFAULT 0,
    UsarSecuenciaPorGrupo BIT NOT NULL DEFAULT 0,
    CategoriaDefecto NVARCHAR(100) NULL,
    UnidadMedidaDefecto NVARCHAR(50) NULL,
    RequiereCodBarras BIT NOT NULL DEFAULT 0,
    ActivarPorDefecto BIT NOT NULL DEFAULT 1,
    RutaImagenesDefecto NVARCHAR(500) NULL,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NOT NULL DEFAULT GETDATE(),
    UsuarioModificacion NVARCHAR(100) NULL
);

-- Tabla para secuencias por grupo de producto
CREATE TABLE ArticuloSecuenciaPorGrupo (
    Id INT PRIMARY KEY IDENTITY(1,1),
    GrupoProducto NVARCHAR(100) NOT NULL,
    Prefijo NVARCHAR(10) NULL,
    SiguienteNumero NVARCHAR(20) NOT NULL DEFAULT '00001',
    LongitudMinima INT NOT NULL DEFAULT 5,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_GrupoProducto UNIQUE (GrupoProducto)
);

-- Insertar configuración por defecto
INSERT INTO ArticuloConfiguracion (
    Prefijo, 
    SiguienteNumero, 
    LongitudMinima, 
    PermitirEdicion, 
    UsarSecuenciaPorGrupo,
    UnidadMedidaDefecto,
    ActivarPorDefecto,
    RutaImagenesDefecto
) VALUES (
    'ART-', 
    '00001', 
    5, 
    0, 
    0,
    'UND',
    1,
    NULL
);

-- Insertar secuencias por grupo por defecto
INSERT INTO ArticuloSecuenciaPorGrupo (GrupoProducto, Prefijo, SiguienteNumero, LongitudMinima, Activo)
VALUES 
    ('Profesional', 'PROF-', '00001', 5, 1),
    ('Industrial', 'IND-', '00001', 5, 1),
    ('Hogar', 'HOG-', '00001', 5, 1),
    ('Comercial', 'COM-', '00001', 5, 0);

-- Tabla para grupos de producto (catálogo)
CREATE TABLE GruposProducto (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Codigo NVARCHAR(20) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_GrupoProducto_Codigo UNIQUE (Codigo),
    CONSTRAINT UQ_GrupoProducto_Nombre UNIQUE (Nombre)
);

-- Insertar grupos de producto por defecto
INSERT INTO GruposProducto (Codigo, Nombre, Descripcion, Activo)
VALUES 
    ('PROF', 'Profesional', 'Grupo de productos profesionales', 1),
    ('IND', 'Industrial', 'Grupo de productos industriales', 1),
    ('HOG', 'Hogar', 'Grupo de productos para el hogar', 1),
    ('COM', 'Comercial', 'Grupo de productos comerciales', 1);

GO
