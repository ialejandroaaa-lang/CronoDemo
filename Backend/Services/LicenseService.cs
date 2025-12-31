using System.Security.Cryptography;
using System.Text;

namespace PosCrono.API.Services
{
    public class LicenseService
    {
        private const string SecretSalt = "CRONO_DEMO_2025_SECRET";

        public bool ValidateTrialKey(string key, out int daysToGrant)
        {
            daysToGrant = 0;
            if (string.IsNullOrEmpty(key)) return false;

            // Simple validation logic for demo:
            // "RENEW-45-ABCD" where HL is a hash or similar
            if (key.StartsWith("RENEW-45-"))
            {
                daysToGrant = 45;
                return true;
            }
            if (key.StartsWith("RENEW-90-"))
            {
                daysToGrant = 90;
                return true;
            }

            return false;
        }
    }
}
