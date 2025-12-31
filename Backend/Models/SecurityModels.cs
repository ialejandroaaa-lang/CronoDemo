using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    public class ApplicationUser : IdentityUser<int>
    {
        public string? FullName { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ApplicationRole : IdentityRole<int>
    {
        public string? Description { get; set; }
        public bool IsSystemRole { get; set; } = false;
    }

    public class SecurityObject
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Code { get; set; } = string.Empty; // e.g., "POS_DELETE_LINE"

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; // e.g., "Permitir borrar línea de POS"

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty; // e.g., "POS", "Inventory"

        public string? Description { get; set; }
    }

    public class SecurityGroupPermission
    {
        [Key]
        public int Id { get; set; }

        public int RoleId { get; set; }
        
        public int SecurityObjectId { get; set; }

        public bool IsAllowed { get; set; } = false;

        /// <summary>
        /// 0 = Hidden, 1 = Disabled (Visible but Read-only)
        /// </summary>
        public int UIBehavior { get; set; } = 0;

        [ForeignKey("RoleId")]
        public virtual ApplicationRole? Role { get; set; }

        [ForeignKey("SecurityObjectId")]
        public virtual SecurityObject? SecurityObject { get; set; }
    }
}
