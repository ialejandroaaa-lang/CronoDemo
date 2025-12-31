using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Models;

namespace PosCrono.API.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Client> Clients { get; set; }
        public DbSet<Seller> Sellers { get; set; }
        public DbSet<MotivoAjuste> MotivosAjuste { get; set; }
        public DbSet<ClientConfiguration> ClientConfigurations { get; set; }
        public DbSet<ProveedorConfiguration> ProveedorConfigurations { get; set; }
        public DbSet<CompanyConfiguration> CompanyConfigurations { get; set; }
        public DbSet<PaymentConfiguration> PaymentConfigurations { get; set; }
        public DbSet<RecibosMaster> RecibosMaster { get; set; }
        public DbSet<ReciboConfiguration> ReciboConfigurations { get; set; }
        public DbSet<DocumentSequence> DocumentSequences { get; set; }
        public DbSet<NcfSecuencia> NcfSecuencias { get; set; }
        public DbSet<TransferenciaConfiguration> TransferenciaConfigurations { get; set; }
        public DbSet<AjusteConfiguration> AjusteConfigurations { get; set; }
        public DbSet<TrialConfiguration> TrialConfigurations { get; set; }

        // Promotion Engine
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<PromotionRule> PromotionRules { get; set; }
        public DbSet<PromotionAction> PromotionActions { get; set; }
        public DbSet<PromotionCoupon> PromotionCoupons { get; set; }



        // Security Editor Tables
        public DbSet<SecurityObject> SecurityObjects { get; set; }
        public DbSet<SecurityGroupPermission> SecurityGroupPermissions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure SecurityGroupPermission
            modelBuilder.Entity<SecurityGroupPermission>()
                .HasOne(p => p.Role)
                .WithMany()
                .HasForeignKey(p => p.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SecurityGroupPermission>()
                .HasOne(p => p.SecurityObject)
                .WithMany()
                .HasForeignKey(p => p.SecurityObjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
