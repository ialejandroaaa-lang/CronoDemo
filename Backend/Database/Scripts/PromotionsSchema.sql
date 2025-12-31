-- PROMOTION ENGINE SCHEMA
-- Supports: Rules, Actions, Coupons, Loyalty Tiers, Smart Stacking

-- 1. PROMOTIONS HEADER
CREATE TABLE [dbo].[Promotions] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    [StartDate] DATETIME NOT NULL,
    [EndDate] DATETIME NULL,
    [IsActive] BIT DEFAULT 1 NOT NULL,
    [Priority] INT DEFAULT 0 NOT NULL, -- Higher number = higher priority for conflict resolution
    [RequiresCoupon] BIT DEFAULT 0 NOT NULL,
    [AutoApply] BIT DEFAULT 1 NOT NULL, -- If true, engine applies it automatically if rules met
    [Stackable] BIT DEFAULT 0 NOT NULL, -- If true, can be combined with other offers
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [CreatedBy] NVARCHAR(50) NULL
);
GO

-- 2. PROMOTION RULES (Conditions)
-- Defines "WHEN" the promotion applies
CREATE TABLE [dbo].[PromotionRules] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [PromotionId] INT NOT NULL FOREIGN KEY REFERENCES Promotions(Id),
    [Type] NVARCHAR(50) NOT NULL, 
    -- Types: 'MinTotal', 'MinQty', 'ProductCategory', 'ProductInclude', 'CustomerTier', 'DayOfWeek'
    [Operator] NVARCHAR(20) NOT NULL, -- 'GreaterThan', 'Equals', 'In', 'Between'
    [Value] NVARCHAR(MAX) NOT NULL, -- JSON or String value to compare (e.g., '100.00', '["Jeans","Shirts"]', 'Gold')
    [Group] INT DEFAULT 0 -- For grouping AND/OR logic (0=All Must Match)
);
GO

-- 3. PROMOTION ACTIONS (Benefits)
-- Defines "WHAT" the customer gets
CREATE TABLE [dbo].[PromotionActions] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [PromotionId] INT NOT NULL FOREIGN KEY REFERENCES Promotions(Id),
    [Type] NVARCHAR(50) NOT NULL, 
    -- Types: 'DiscountPercentage', 'DiscountFixed', 'FreeItem', 'PointsMultiplier'
    [Value] DECIMAL(18,2) NOT NULL, -- 10.00 (%), 5.00 ($), 2 (Multiplier)
    [AppliesTo] NVARCHAR(50) NOT NULL, -- 'Order', 'LineItem', 'CheapestItem', 'SpecificProduct'
    [TargetArtifact] NVARCHAR(MAX) NULL -- ProductId or CategoryId if applies to specific items
);
GO

-- 4. COUPONS
CREATE TABLE [dbo].[PromotionCoupons] (
    [Code] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [PromotionId] INT NOT NULL FOREIGN KEY REFERENCES Promotions(Id),
    [MaxUses] INT NULL,
    [UsedCount] INT DEFAULT 0,
    [CustomerId] INT NULL, -- If assigned to specific customer
    [IsActive] BIT DEFAULT 1
);
GO

-- 5. LOYALTY TIERS (Integration)
-- Creates the structure for "Gold/Silver" levels if not exists in Clients
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'LoyaltyTier')
BEGIN
    ALTER TABLE [dbo].[Clients] ADD [LoyaltyTier] NVARCHAR(20) DEFAULT 'Bronze';
    ALTER TABLE [dbo].[Clients] ADD [LoyaltyPoints] INT DEFAULT 0;
END
GO
