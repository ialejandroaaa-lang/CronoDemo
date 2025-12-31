using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMINISTRADORES")] // Only admins can use the Security Editor
    public class SecurityEditorController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public SecurityEditorController(AppDbContext context, RoleManager<ApplicationRole> roleManager, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _roleManager = roleManager;
            _userManager = userManager;
        }

        // --- GROUPS (ROLES) ---

        [HttpGet("groups")]
        public async Task<IActionResult> GetGroups()
        {
            var groups = await _roleManager.Roles
                .OrderBy(r => r.Name)
                .Select(r => new {
                    id = r.Id,
                    name = r.Name,
                    description = r.Description,
                    isSystemRole = r.IsSystemRole
                })
                .ToListAsync();
            return Ok(groups);
        }

        [HttpPost("groups")]
        public async Task<IActionResult> CreateGroup([FromBody] ApplicationRole role)
        {
            if (string.IsNullOrEmpty(role.Name)) return BadRequest("Nombre es requerido");
            
            role.Name = role.Name.ToUpper();
            var result = await _roleManager.CreateAsync(role);
            if (result.Succeeded) return Ok(role);
            
            return BadRequest(result.Errors);
        }

        // --- SECURITY OBJECTS (PERMISSIONS CATALOG) ---

        [HttpGet("permissions-catalog")]
        public async Task<IActionResult> GetPermissionsCatalog()
        {
            var catalog = await _context.SecurityObjects
                .OrderBy(o => o.Category)
                .ThenBy(o => o.Name)
                .ToListAsync();
            return Ok(catalog);
        }

        // --- GROUP PERMISSIONS (THE MATRIX) ---

        [HttpGet("group-permissions/{roleId}")]
        public async Task<IActionResult> GetGroupPermissions(int roleId)
        {
            var permissions = await _context.SecurityGroupPermissions
                .Where(p => p.RoleId == roleId)
                .ToListAsync();
            return Ok(permissions);
        }

        [HttpPost("group-permissions/bulk-update")]
        public async Task<IActionResult> UpdateGroupPermissions([FromBody] List<SecurityGroupPermission> permissions)
        {
            if (permissions == null || !permissions.Any()) return BadRequest("No hay datos para actualizar");

            var roleId = permissions.First().RoleId;
            
            // Validate role
            var role = await _roleManager.FindByIdAsync(roleId.ToString());
            if (role == null) return NotFound("Grupo no encontrado");

            foreach (var perm in permissions)
            {
                var existing = await _context.SecurityGroupPermissions
                    .FirstOrDefaultAsync(p => p.RoleId == roleId && p.SecurityObjectId == perm.SecurityObjectId);

                if (existing != null)
                {
                    existing.IsAllowed = perm.IsAllowed;
                    existing.UIBehavior = perm.UIBehavior;
                }
                else
                {
                    _context.SecurityGroupPermissions.Add(perm);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Permisos actualizados correctamente" });
        }

        // --- USER MANAGEMENT ---

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users.Select(u => new {
                id = u.Id,
                userName = u.UserName,
                fullName = u.FullName,
                email = u.Email,
                isActive = u.IsActive
            }).ToListAsync();
            
            return Ok(users);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (request == null) return BadRequest();
            
            var user = new ApplicationUser { 
                UserName = request.UserName, 
                FullName = request.FullName,
                Email = request.Email,
                IsActive = true 
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // Assign role if provided
            if (!string.IsNullOrEmpty(request.Role))
            {
                await _userManager.AddToRoleAsync(user, request.Role.ToUpper());
            }

            return Ok(user);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.IsActive = request.IsActive;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // Update role if changed
            if (!string.IsNullOrEmpty(request.Role))
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, request.Role.ToUpper());
            }

            return Ok(user);
        }

        [HttpPost("users/{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
            
            if (result.Succeeded) return Ok(new { message = "Contraseña reseteada con éxito" });
            return BadRequest(result.Errors);
        }

        public class CreateUserRequest
        {
            public string UserName { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string? Role { get; set; }
        }

        public class UpdateUserRequest
        {
            public string FullName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public bool IsActive { get; set; }
            public string? Role { get; set; }
        }

        public class ResetPasswordRequest
        {
            public string NewPassword { get; set; } = string.Empty;
        }
    }
}
