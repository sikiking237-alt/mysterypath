# admin_manager.ps1
param(
    [string]$Action = "stats",
    [string]$Token = $env:MYSTERY_PATH_ADMIN_TOKEN,
    [string]$Email = "",
    [string]$Password = "",
    [string]$Name = "",
    [string]$Role = "user"
)

if (-not $Token) {
    Write-Host "❌ Admin token not found. Please provide it via the -Token parameter or set the MYSTERY_PATH_ADMIN_TOKEN environment variable." -ForegroundColor Red
    Write-Host "   You can get a token by logging in as an admin user (e.g., admin@learnflow.com)." -ForegroundColor Yellow
    return
}

$BaseUrl = "http://localhost:5000/api"
$headers = @{
    "Authorization" = "Bearer $Token"
}

function Handle-Error {
    param($Exception)
    
    if ($Exception.Response) {
        $statusCode = $Exception.Response.StatusCode.value__
        $statusDescription = $Exception.Response.StatusDescription
        Write-Host "❌ Request failed with status: $statusCode ($statusDescription)" -ForegroundColor Red
        
        try {
            $stream = $Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $reader.BaseStream.Position = 0
            $errorBody = $reader.ReadToEnd()
            if ($errorBody) {
                Write-Host "   Error Body:" -ForegroundColor Yellow
                Write-Host $errorBody -ForegroundColor Yellow
            }
        } catch {} # Ignore if can't read body
    } else {
        Write-Host "❌ An unexpected error occurred: $($Exception.Message)" -ForegroundColor Red
    }
}

function Get-AdminStats {
    Write-Host "📊 Fetching admin stats..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/admin/stats" -Method GET -Headers $headers
        if ($response) {
            $stats = $response
            Write-Host @"
✅ Admin Dashboard Stats:
   Total Users: $($stats.totalUsers)
   Total Courses: $($stats.totalCourses)
   Total Enrollments: $($stats.totalEnrollments)
   Active Students: $($stats.activeStudents)
   Active Instructors: $($stats.activeInstructors)
   Total Revenue: `$$($stats.totalRevenue)
   Completed Courses: $($stats.completedCourses)
   Average Rating: $($stats.averageRating)
"@ -ForegroundColor Green
        }
    } catch {
        Handle-Error $_.Exception
    }
}

function Get-AdminUsers {
    Write-Host "👥 Fetching users..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/admin/users" -Method GET -Headers $headers
        if ($response.success) {
            $users = $response.users
            Write-Host "Total Users: $($users.Count)" -ForegroundColor Green
            $users | Select-Object id, name, email, role, is_active | Format-Table
        }
    } catch {
        Handle-Error $_.Exception
    }
}

function Get-AdminCourses {
    Write-Host "📚 Fetching courses..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/admin/all-courses" -Method GET -Headers $headers
        if ($response) {
            $courses = $response
            Write-Host "Total Courses: $($courses.Count)" -ForegroundColor Green
            $courses | Select-Object id, title, level, price, students | Format-Table
        }
    } catch {
        Handle-Error $_.Exception
    }
}

function Create-AdminUser {
    param($Email, $Password, $Name, $Role)
    
    if (!$Email -or !$Password) {
        Write-Host "❌ Email and password are required" -ForegroundColor Red
        return
    }
    
    $body = @{
        name = if ($Name) { $Name } else { $Email.Split('@')[0] }
        email = $Email
        password = $Password
        role = $Role
    } | ConvertTo-Json
    
    Write-Host "👤 Creating user: $Email..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/admin/users" -Method POST -Body $body -ContentType "application/json" -Headers $headers
        if ($response.success) {
            Write-Host "✅ User created successfully!" -ForegroundColor Green
            Write-Host "   Name: $($response.user.name)"
            Write-Host "   Email: $($response.user.email)"
            Write-Host "   Role: $($response.user.role)"
        }
    } catch {
        Handle-Error $_.Exception
    }
}

# Main menu
switch ($Action) {
    "stats" { Get-AdminStats }
    "users" { Get-AdminUsers }
    "courses" { Get-AdminCourses }
    "create" { Create-AdminUser -Email $Email -Password $Password -Name $Name -Role $Role }
    default {
        Write-Host @"
╔═══════════════════════════════════════════════════════╗
║  🚀 Admin Management Script                          ║
╠═══════════════════════════════════════════════════════╣
║  Usage: .\admin_manager.ps1 <command> -Token <YOUR_TOKEN>
║  Commands:                                            ║
║    .\admin_manager.ps1 stats    - Show admin stats    ║
║    .\admin_manager.ps1 users    - List all users      ║
║    .\admin_manager.ps1 courses  - List all courses    ║
║    .\admin_manager.ps1 create   - Create user         ║
║       -Email user@example.com                        ║
║       -Password pass123                              ║
║       -Name "User Name" (optional)                   ║
║       -Role user (optional)                          ║
╚═══════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan
    }
}
