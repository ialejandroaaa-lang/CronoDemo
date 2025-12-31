using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using PosCrono.API.Data;
using PosCrono.API.Dtos;
using PosCrono.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace PosCrono.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            AppDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userManager.FindByNameAsync(loginDto.UserName);
            if (user == null || !user.IsActive)
                return Unauthorized(new { message = "Usuario no válido o inactivo" });

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            if (!result.Succeeded)
                return Unauthorized(new { message = "Contraseña incorrecta" });

            // Get Roles
            var roles = await _userManager.GetRolesAsync(user);
            var roleName = roles.FirstOrDefault() ?? "SIN_GRUPO";

            // Get Permissions for this role
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            var permissions = new List<string>();
            
            if (role != null)
            {
                permissions = await _context.SecurityGroupPermissions
                    .Where(p => p.RoleId == role.Id && p.IsAllowed)
                    .Include(p => p.SecurityObject)
                    .Select(p => p.SecurityObject!.Code)
                    .ToListAsync();
            }

            // Generate JWT
            var token = GenerarJwtToken(user, roleName, permissions);

            return Ok(new AuthResponseDto
            {
                Token = token,
                UserName = user.UserName!,
                FullName = user.FullName ?? user.UserName!,
                Role = roleName,
                Permissions = permissions
            });
        }

        private string GenerarJwtToken(ApplicationUser user, string role, List<string> permissions)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings.GetValue<string>("Key") ?? "SUPER_SECRET_KEY_FOR_POS_CRONO_2025");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Role, role)
            };

            // Add permissions as claims
            foreach (var perm in permissions)
            {
                claims.Add(new Claim("permission", perm));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(8),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userIdStr);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);
            var roleName = roles.FirstOrDefault() ?? "SIN_GRUPO";

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            var permissions = new List<string>();
            
            if (role != null)
            {
                permissions = await _context.SecurityGroupPermissions
                    .Where(p => p.RoleId == role.Id && p.IsAllowed)
                    .Include(p => p.SecurityObject)
                    .Select(p => p.SecurityObject!.Code)
                    .ToListAsync();
            }

            return Ok(new
            {
                userName = user.UserName,
                fullName = user.FullName,
                role = roleName,
                permissions = permissions
            });
        }
    }
}
