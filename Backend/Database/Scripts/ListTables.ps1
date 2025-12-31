$connectionString = "Server=GABRIEL;Database=CRONODEMO;Trusted_Connection=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name FROM sys.tables"
    $reader = $cmd.ExecuteReader()
    while($reader.Read()){
        Write-Host $reader.GetString(0)
    }
} finally {
    $conn.Close()
}
