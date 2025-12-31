using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;

namespace PosCrono.API.Filters
{
    public class TrialActionFilter : IAsyncActionFilter
    {
        private readonly AppDbContext _context;

        public TrialActionFilter(AppDbContext context)
        {
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Only check for modifying requests
            var method = context.HttpContext.Request.Method;
            if (method == "POST" || method == "PUT" || method == "DELETE")
            {
                // Skip Auth and Trial controller itself
                var path = context.HttpContext.Request.Path.Value?.ToLower();
                if (path != null && (path.Contains("/auth/") || path.Contains("/trial/")))
                {
                    await next();
                    return;
                }

                var config = await _context.TrialConfigurations.FirstOrDefaultAsync();
                if (config != null)
                {
                    var daysElapsed = (DateTime.Now - config.InstallationDate).Days;
                    if (daysElapsed > config.TrialDays)
                    {
                        context.Result = new ObjectResult(new { 
                            message = "PERIODO DE PRUEBA EXPIRADO. Por favor, adquiera la versión completa para continuar.",
                            isExpired = true
                        }) { StatusCode = 403 };
                        return;
                    }
                }
            }

            await next();
        }
    }
}
