-- Inspect Users
SELECT Id, UserName, Email, FullName, IsActive, PasswordHash, SecurityStamp FROM AspNetUsers;

-- Inspect Roles
SELECT Id, Name FROM AspNetRoles;

-- Inspect User Roles
SELECT UserId, RoleId FROM AspNetUserRoles;

-- Chequear si existe el usuario Admin (ID esperado)
SELECT * FROM AspNetUsers WHERE UserName = 'admin';
