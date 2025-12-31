-- POPOULATE DATA FOR SMARTLISTS
-- 1. Insert more Articles
INSERT INTO ArticulosMaster (NumeroArticulo, Descripcion, UnidadMedida, AlmacenPrincipal, CostoUnitario, PrecioUnitario, Activo, FechaCreacion, StockActual)
VALUES 
('HER-005', 'Juego de Herramientas 100 Piezas', 'SET', 1, 2500.00, 4500.00, 1, GETDATE(), 15),
('PIN-010', 'Pintura Acrílica Galón Blanco', 'GLN', 2, 850.00, 1400.00, 1, GETDATE(), 40),
('ELEC-015', 'Bombilla LED 10W (Caja 10)', 'CAJA', 3, 400.00, 750.00, 1, GETDATE(), 60),
('MAD-020', 'Plywood 4x8x1/2', 'PLANCHA', 1, 1200.00, 2100.00, 1, GETDATE(), 25),
('BAÑ-025', 'Inodoro One Piece Blanco', 'UND', 4, 4500.00, 8500.00, 1, GETDATE(), 10),
('COC-030', 'Fregadero Doble Acero Inox', 'UND', 1, 3200.00, 6200.00, 1, GETDATE(), 8),
('PVC-035', 'Tubo PVC 2 pulg x 19 pies', 'TUBO', 5, 250.00, 480.00, 1, GETDATE(), 100),
('CEM-040', 'Cemento Gris Tipo Portland', 'FONDA', 2, 480.00, 560.00, 1, GETDATE(), 200),
('VAR-045', 'Varilla 3/8 pulgada (Atado)', 'ATADO', 3, 15000.00, 18500.00, 1, GETDATE(), 5),
('CER-050', 'Cerámica Piso 60x60 (Caja)', 'CAJA', 4, 850.00, 1550.00, 1, GETDATE(), 80);

-- 2. Insert more Providers (Fixed column names: NumeroDocumento, Correo)
INSERT INTO ProveedoresMaster (CodigoProveedor, RazonSocial, NumeroDocumento, Telefono, Correo, Activo, FechaCreacion)
VALUES 
('PROV-007', 'Ferretería Ochoa S.A.', '101002034', '809-555-0100', 'ventas@ochoa.com.do', 1, GETDATE()),
('PROV-008', 'Distribuidora Corripio', '101005067', '809-555-0200', 'info@corripio.com.do', 1, GETDATE()),
('PROV-009', 'Lanco Dominicana', '101008092', '809-555-0300', 'pedidos@lanco.com.do', 1, GETDATE()),
('PROV-010', 'Importadora Jimenez', '101011034', '809-555-0400', 'ventas@jimenez.com', 1, GETDATE());

-- 3. Insert Purchases (ComprasMaster & ComprasDetalle)
-- We will use a cursor or separate inserts to be safe
DECLARE @i INT = 1;
DECLARE @ProvId INT;
DECLARE @MonId INT;
DECLARE @AlmId INT;
DECLARE @Total DECIMAL(18,2);
DECLARE @Sub DECIMAL(18,2);
DECLARE @Imp DECIMAL(18,2);
DECLARE @Num NVARCHAR(50);
DECLARE @CID INT;

WHILE @i <= 50
BEGIN
    SET @ProvId = (SELECT TOP 1 Id FROM ProveedoresMaster ORDER BY NEWID());
    SET @MonId = (SELECT TOP 1 Id FROM Monedas ORDER BY NEWID());
    SET @AlmId = (SELECT TOP 1 Id FROM Almacenes ORDER BY NEWID());
    SET @Sub = ROUND(RAND() * 50000 + 1000, 2);
    SET @Imp = @Sub * 0.18;
    SET @Total = @Sub + @Imp;
    SET @Num = 'OC-MOCK-' + CAST(@i + 100 AS NVARCHAR(50));
    
    INSERT INTO ComprasMaster (NumeroCompra, ProveedorId, FechaCompra, Estado, TerminosPago, ReferenciaProveedor, Subtotal, Impuestos, Total, Saldo, Observaciones, UsuarioCreacion, FechaCreacion, AlmacenId, MonedaId, TasaCambio, TipoDocumento)
    VALUES (@Num, @ProvId, DATEADD(day, -RAND()*60, GETDATE()), 'Completado', 'Credito 30 dias', 'REF-' + CAST(@i AS NVARCHAR), @Sub, @Imp, @Total, @Total, 'Carga masiva de datos', 'Sistema', GETDATE(), @AlmId, @MonId, CASE WHEN @MonId = 1 THEN 1.0 ELSE 60.50 END, 'Factura');
    
    SET @CID = SCOPE_IDENTITY();
    
    -- Insert 1 to 3 details for each purchase
    INSERT INTO ComprasDetalle (CompraId, ArticuloId, NumeroArticulo, Descripcion, Cantidad, UnidadMedida, CostoUnitario, PorcentajeImpuesto, MontoImpuesto, TotalLinea, AlmacenId)
    SELECT TOP (CAST(RAND()*3 + 1 AS INT)) @CID, Id, NumeroArticulo, Descripcion, CAST(RAND()*10 + 1 AS INT), UnidadMedida, CostoUnitario, 18.00, CostoUnitario * 0.18, CostoUnitario, @AlmId
    FROM ArticulosMaster ORDER BY NEWID();
    
    SET @i = @i + 1;
END

-- 4. Apply some payments
SET @i = 1;
WHILE @i <= 20
BEGIN
    DECLARE @CompId INT = (SELECT TOP 1 Id FROM ComprasMaster WHERE Saldo > 0 AND Estado <> 'Anulado' ORDER BY NEWID());
    DECLARE @PayAmount DECIMAL(18,2);
    DECLARE @CurrentSaldo DECIMAL(18,2);
    DECLARE @P_ProvId INT;
    DECLARE @P_MonId INT;
    DECLARE @P_Num NVARCHAR(50);
    DECLARE @PID INT;

    SELECT @CurrentSaldo = Saldo, @P_ProvId = ProveedorId, @P_MonId = MonedaId FROM ComprasMaster WHERE Id = @CompId;
    SET @PayAmount = CASE WHEN RAND() > 0.5 THEN @CurrentSaldo ELSE @CurrentSaldo * 0.5 END;
    SET @P_Num = 'PAY-MOCK-' + CAST(@i + 100 AS NVARCHAR(50));

    INSERT INTO PagosMaster (ProveedorId, Fecha, Metodo, Monto, Referencia, Estado, Nota, Usuario, FechaCreacion, MonedaId, TasaCambio)
    VALUES (@P_ProvId, GETDATE(), 'Transferencia', @PayAmount, 'REF-PAY-' + CAST(@i AS NVARCHAR), 'Completado', 'Carga masiva de datos', 'Sistema', GETDATE(), @P_MonId, 1.0);
    
    SET @PID = SCOPE_IDENTITY();
    
    INSERT INTO PagosDetalle (PagoId, CompraId, MontoAplicado)
    VALUES (@PID, @CompId, @PayAmount);
    
    UPDATE ComprasMaster SET Saldo = Saldo - @PayAmount WHERE Id = @CompId;
    
    SET @i = @i + 1;
END
