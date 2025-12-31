IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AjusteConfigurations' AND xtype='U')
BEGIN
    CREATE TABLE AjusteConfigurations (
        Id INT PRIMARY KEY IDENTITY(1,1),
        DefaultPlanId NVARCHAR(50),
        DefaultUnit NVARCHAR(20)
    );
END
