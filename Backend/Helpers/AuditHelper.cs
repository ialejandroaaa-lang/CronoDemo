using System.Data;
using Dapper;
using Newtonsoft.Json;

namespace PosCrono.API.Helpers
{
    public static class AuditHelper
    {
        public static async Task LogAsync(
            IDbConnection connection, 
            IDbTransaction transaction, 
            string tableName, 
            string recordId, 
            string action, 
            object oldValues, 
            object newValues, 
            string usuario)
        {
            var sql = @"
                INSERT INTO AuditLog (TableName, RecordId, Action, OldValues, NewValues, Usuario, Fecha)
                VALUES (@TableName, @RecordId, @Action, @OldValues, @NewValues, @Usuario, GETDATE())";

            await connection.ExecuteAsync(sql, new
            {
                TableName = tableName,
                RecordId = recordId,
                Action = action,
                OldValues = oldValues != null ? JsonConvert.SerializeObject(oldValues) : (string)null,
                NewValues = newValues != null ? JsonConvert.SerializeObject(newValues) : (string)null,
                Usuario = usuario ?? "Sistema"
            }, transaction: transaction);
        }
    }
}
