IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TransferenciaConfigurations' AND xtype='U')
BEGIN
    CREATE TABLE TransferenciaConfigurations (
        Id INT PRIMARY KEY IDENTITY(1,1),
        DefaultPlanId NVARCHAR(50) NULL
    );
    
    INSERT INTO TransferenciaConfigurations (DefaultPlanId) VALUES (NULL);
END
