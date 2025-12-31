
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProveedorConfigurations')
BEGIN
    CREATE TABLE ProveedorConfigurations (
        Id INT PRIMARY KEY IDENTITY(1,1),
        
        -- Secuencia Start
        UseAutoSequence BIT NOT NULL DEFAULT 1,
        UseInitials BIT NOT NULL DEFAULT 0,
        Initials NVARCHAR(10) NULL DEFAULT 'PROV',
        SequenceLength INT NOT NULL DEFAULT 4,
        CurrentValue INT NOT NULL DEFAULT 1,
        Separator NVARCHAR(5) NULL DEFAULT '-',
        
        -- Business Rules
        HabilitarFacturas BIT NOT NULL DEFAULT 1,
        HabilitarPagoRecurrente BIT NOT NULL DEFAULT 0,
        
        -- Frequencies
        HabilitarFrecuenciaSemanal BIT NOT NULL DEFAULT 0,
        HabilitarFrecuenciaQuincenal BIT NOT NULL DEFAULT 0,
        HabilitarFrecuenciaMensual BIT NOT NULL DEFAULT 1,
        HabilitarFechasEspecificas BIT NOT NULL DEFAULT 0,
        
        LastModified DATETIME DEFAULT GETDATE()
    );

    -- Insert default configuration
    INSERT INTO ProveedorConfigurations (
        UseAutoSequence, UseInitials, Initials, SequenceLength, CurrentValue, 
        HabilitarFacturas, HabilitarPagoRecurrente, 
        HabilitarFrecuenciaSemanal, HabilitarFrecuenciaQuincenal, HabilitarFrecuenciaMensual, HabilitarFechasEspecificas
    ) VALUES (
        1, 1, 'PROV', 4, 1,
        1, 1,
        0, 0, 1, 1
    );
END
