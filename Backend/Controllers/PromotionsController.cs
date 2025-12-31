using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PosCrono.API.DTOs;


namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromotionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PromotionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Promotions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Promotion>>> GetPromotions()
        {
            return await _context.Promotions
                .Include(p => p.Rules)
                .Include(p => p.Actions)
                .ToListAsync();
        }

        // GET: api/Promotions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Promotion>> GetPromotion(int id)
        {
            var promotion = await _context.Promotions
                .Include(p => p.Rules)
                .Include(p => p.Actions)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (promotion == null)
            {
                return NotFound();
            }

            return promotion;
        }

        // POST: api/Promotions
        [HttpPost]
        public async Task<ActionResult<Promotion>> CreatePromotion(Promotion promotion)
        {
            // Reset IDs for new rules/actions ensuring they are treated as new
            if (promotion.Rules != null)
                foreach(var r in promotion.Rules) r.Id = 0;
            
            if (promotion.Actions != null)
                foreach(var a in promotion.Actions) a.Id = 0;

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPromotion", new { id = promotion.Id }, promotion);
        }

        // PUT: api/Promotions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePromotion(int id, Promotion promotion)
        {
            if (id != promotion.Id)
            {
                return BadRequest();
            }

            // For simplicity in updating nested collections (Rules/Actions), 
            // we can just delete old ones and re-insert new ones, or try to merge.
            // Easy way: Load existing, remove sub-items, add new sub-items.
            
            var existing = await _context.Promotions
                .Include(p => p.Rules)
                .Include(p => p.Actions)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (existing == null) return NotFound();

            // Update Header fields
            _context.Entry(existing).CurrentValues.SetValues(promotion);

            // Replace Rules
            _context.PromotionRules.RemoveRange(existing.Rules);
            if (promotion.Rules != null)
            {
                foreach(var r in promotion.Rules) r.Id = 0; // Ensure new IDs
                existing.Rules = promotion.Rules;
            }

            // Replace Actions
            _context.PromotionActions.RemoveRange(existing.Actions);
             if (promotion.Actions != null)
            {
                foreach(var a in promotion.Actions) a.Id = 0;
                existing.Actions = promotion.Actions;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PromotionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Promotions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePromotion(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
            {
                return NotFound();
            }

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PromotionExists(int id)
        {
            return _context.Promotions.Any(e => e.Id == id);
        }

        // POST: api/Promotions/Calculate
        // The Brain: Takes a Cart, returns Cart with Discounts
        // POST: api/Promotions/Calculate
        // The Brain: Takes a Cart, returns Cart with Discounts
        [HttpPost("Calculate")]
        public async Task<IActionResult> Calculate([FromBody] CartDto cart)
        {
            // 1. Fetch Active Promotions
            var now = DateTime.Now;
            var query = _context.Promotions
                .Include(p => p.Rules)
                .Include(p => p.Actions)
                .Where(p => p.IsActive && p.StartDate <= now && (p.EndDate == null || p.EndDate >= now));

            // Filter by Scope
            if (!string.IsNullOrEmpty(cart.ApplyTo))
            {
                query = query.Where(p => p.ApplyTo == "Both" || p.ApplyTo == cart.ApplyTo);
            }

            var promos = await query
                .OrderByDescending(p => p.Priority)
                .ToListAsync();

            // 2. Run Engine
            var result = new CartCalculationResult 
            { 
                OriginalTotal = cart.Total,
                FinalTotal = cart.Total
            };
            
            decimal totalDiscount = 0;

            foreach(var promo in promos)
            {
                if (EvaluateRules(promo, cart))
                {
                    decimal discountForPromo = ApplyActions(promo, cart);
                    if (discountForPromo > 0)
                    {
                        totalDiscount += discountForPromo;
                        result.AppliedPromotions.Add(promo.Name);
                        
                        // Stop if not stackable
                        if (!promo.Stackable)
                        {
                            break; 
                        }
                    }
                }
            }

            // Cap discount at total? Optional business rule, good for safety.
            if (totalDiscount > cart.Total) 
            {
                totalDiscount = cart.Total;
            }

            result.DiscountTotal = totalDiscount;
            result.FinalTotal = result.OriginalTotal - totalDiscount;

            return Ok(result);
        }

        private bool EvaluateRules(Promotion promo, CartDto cart)
        {
            if (promo.Rules == null || !promo.Rules.Any()) return true; // No rules = applies always (if active)

            foreach (var rule in promo.Rules)
            {
                bool rulePassed = false;
                switch (rule.Type)
                {
                    case "MinOrderTotal":
                        if (decimal.TryParse(rule.Value, out decimal minTotal))
                        {
                            rulePassed = cart.Total >= minTotal;
                        }
                        break;
                    
                    case "ContainsProduct":
                        if (int.TryParse(rule.Value, out int productId))
                        {
                            rulePassed = cart.Items.Any(i => i.ProductId == productId);
                        }
                        break;

                     case "ContainsCategory":
                        // Assumes rule.Value is the Category Name
                        rulePassed = cart.Items.Any(i => i.Category != null && i.Category.Equals(rule.Value, StringComparison.OrdinalIgnoreCase));
                        break;

                    default:
                        // Unknown rule type, safe default false? or true? 
                        // Let's fail safe -> false
                        rulePassed = false; 
                        break;
                }

                if (!rulePassed) return false; // AND logic: all rules must pass
            }

            return true;
        }

        private decimal ApplyActions(Promotion promo, CartDto cart)
        {
            decimal discount = 0;
            if (promo.Actions == null) return 0;

            foreach (var action in promo.Actions)
            {
                switch (action.Type)
                {
                    case "DiscountPercentage":
                        decimal pct = action.Value / 100m;
                        if (action.AppliesTo == "Order")
                        {
                            discount += cart.Total * pct;
                        }
                        else if (action.AppliesTo == "SpecificProduct")
                        {
                            if (int.TryParse(action.TargetArtifact, out int targetId))
                            {
                                var matchingItems = cart.Items.Where(i => i.ProductId == targetId);
                                foreach(var item in matchingItems)
                                {
                                    discount += (item.Price * item.Quantity) * pct;
                                }
                            }
                        }
                         else if (action.AppliesTo == "Category")
                        {
                            var matchingItems = cart.Items.Where(i => i.Category != null && i.Category.Equals(action.TargetArtifact, StringComparison.OrdinalIgnoreCase));
                             foreach(var item in matchingItems)
                                {
                                    discount += (item.Price * item.Quantity) * pct;
                                }
                        }
                        break;

                    case "DiscountAmount":
                        // Fixed amount off
                        discount += action.Value;
                        break;
                }
            }

            return discount;
        }
    }
}
