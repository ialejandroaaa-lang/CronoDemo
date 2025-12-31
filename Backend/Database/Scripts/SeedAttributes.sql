-- Insertar Categorías de Ejemplo
INSERT INTO Categorias (Codigo, Nombre, Descripcion, Activo)
VALUES 
('CAT-001', 'Herramientas', 'Herramientas generales de construcción', 1),
('CAT-002', 'Plomería', 'Materiales y herramientas de fontanería', 1),
('CAT-003', 'Electricidad', 'Cables, interruptores y material eléctrico', 1),
('CAT-004', 'Pinturas', 'Pinturas, barnices y acabados', 1),
('CAT-005', 'Jardinería', 'Herramientas y suministros para jardín', 1);
GO

-- Insertar Marcas de Ejemplo
INSERT INTO Marcas (Codigo, Nombre, Descripcion, Activo)
VALUES 
('MAR-001', 'DeWalt', 'Herramientas de alta gama', 1),
('MAR-002', 'Bosch', 'Tecnología y herramientas alemanas', 1),
('MAR-003', 'Makita', 'Herramientas eléctricas japonesas', 1),
('MAR-004', 'Stanley', 'Herramientas manuales de confianza', 1),
('MAR-005', 'Truper', 'Herramientas con buena relación precio-calidad', 1);
GO

-- Insertar Tipos de Ejemplo
INSERT INTO Tipos (Codigo, Nombre, Descripcion, Activo)
VALUES 
('TIP-001', 'Eléctrico', 'Funciona con corriente eléctrica', 1),
('TIP-002', 'Manual', 'Operación manual sin motor', 1),
('TIP-003', 'Inalámbrico', 'Funciona con baterías recargables', 1),
('TIP-004', 'Neumático', 'Funciona con aire comprimido', 1),
('TIP-005', 'Hidráulico', 'Funciona con presión de fluidos', 1);
GO
