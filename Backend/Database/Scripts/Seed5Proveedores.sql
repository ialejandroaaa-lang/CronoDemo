USE CRONODEMO;
GO

INSERT INTO [dbo].[ProveedoresMaster] (CodigoProveedor, RazonSocial, NumeroDocumento, Direccion, Telefono, Correo, Contacto, Activo, FechaCreacion, UsuarioCreacion)
VALUES 
('PROV001', 'Distribuidora Global S.A.', '101-00123-4', 'Av. Winston Churchill #123, Santo Domingo', '809-555-0101', 'ventas@global.com', 'Juan Perez', 1, GETDATE(), 'Sistema'),
('PROV002', 'Suministros Industriales S.R.L.', '102-45678-9', 'Zona Industrial de Herrera, Calle C #45', '809-555-0102', 'info@suministros.do', 'Maria Garcia', 1, GETDATE(), 'Sistema'),
('PROV003', 'Ferreteria Central', '103-98765-2', 'Av. 27 de Febrero esq. Lincoln', '809-555-0103', 'contacto@ferrecentral.com', 'Luis Martinez', 1, GETDATE(), 'Sistema'),
('PROV004', 'Importaciones del Caribe', '104-11223-3', 'Puerto de Haina, Modulo 7', '809-555-0104', 'import@caribe.com.do', 'Ana Rodriguez', 1, GETDATE(), 'Sistema'),
('PROV005', 'Tecnologia Avanzada S.A.S.', '105-44332-1', 'Calle El Sol #88, Santiago', '809-555-0105', 'tech@avanzada.com', 'Pedro Sanchez', 1, GETDATE(), 'Sistema');
GO
