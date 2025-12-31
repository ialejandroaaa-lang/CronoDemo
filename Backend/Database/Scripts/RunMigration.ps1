$sqlFile = "c:\POS CRONO\Backend\Database\Scripts\AddMetodoPagoToVentas.sql"
$connectionString = "Server=GABRIEL;Database=CRONODEMO;Trusted_Connection=True;TrustServerCertificate=True;"

if (Test-Path $sqlFile) {
    $sql = Get-Content $sqlFile -Raw
    $conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    try {
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $sql
        $cmd.ExecuteNonQuery()
        Write-Host "Migration successful."
    } catch {
        Write-Error "Migration failed: $_"
    } finally {
        $conn.Close()
    }
} else {
    Write-Error "SQL file not found."
}
