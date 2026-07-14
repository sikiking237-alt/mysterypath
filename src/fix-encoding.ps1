# Fix encoding in all JS and JSX files
Get-ChildItem -Path . -Recurse -Include "*.jsx","*.js","*.html","*.css" | ForEach-Object {
    try {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            # Fix common encoding issues
            $content = $content -replace 'ðŸ“š', '📚'
            $content = $content -replace 'ðŸ‘¥', '🔥'
            $content = $content -replace 'ðŸŽ“', '🎓'
            $content = $content -replace 'â­', '⭐'
            $content = $content -replace 'ðŸ“–', '📖'
            $content = $content -replace 'ðŸ†', '🏆'
            $content = $content -replace 'ðŸ’»', '💻'
            $content = $content -replace 'ðŸ¤–', '🤖'
            $content = $content -replace 'ðŸ“…', '📅'
            $content = $content -replace 'ðŸŽ§', '🎧'
            $content = $content -replace 'â¤ï¸', '❤️'
            $content = $content -replace 'ðŸ“', '📝'
            $content = $content -replace 'ðŸƒ', '🏏'
            $content = $content -replace 'ðŸ› ï¸', '🛠️'
            $content = $content -replace 'ðŸŽ¯', '🎯'
            $content = $content -replace 'ðŸ“Š', '📊'
            $content = $content -replace 'ðŸ“±', '📱'
            $content = $content -replace 'âš¡', '⚡'
            $content = $content -replace 'ðŸŽ‰', '🎉'
            $content = $content -replace 'â†’', '→'
            $content = $content -replace 'Â©', '©'
            $content = $content -replace 'â€˜', "'"
            $content = $content -replace 'â€™', "'"
            $content = $content -replace 'â€œ', '"'
            $content = $content -replace 'â€', '"'
            $content = $content -replace 'â€¦', '...'
            $content = $content -replace 'â€“', '–'
            $content = $content -replace 'â€”', '—'
            $content = $content -replace 'â€¢', '•'
            $content = $content -replace 'ðŸŽ', ''
            $content = $content -replace 'ðŸ“', ''
            $content = $content -replace 'ðŸ”', ''
            $content = $content -replace 'ðŸ™', ''
            $content = $content -replace 'ðŸ’', ''
            $content = $content -replace 'ðŸ˜', ''
            $content = $content -replace 'ðŸ¥', ''
            $content = $content -replace 'ðŸ¦', ''
            $content = $content -replace 'ðŸ§', ''
            $content = $content -replace 'ðŸ¨', ''
            $content = $content -replace 'ðŸ©', ''
            $content = $content -replace 'ðŸª', ''
            $content = $content -replace 'ðŸ«', ''
            $content = $content -replace 'ðŸ¬', ''
            $content = $content -replace 'ðŸ­', ''
            $content = $content -replace 'ðŸ®', ''
            $content = $content -replace 'ðŸ¯', ''
            
            # Save with proper UTF-8 encoding
            $content | Out-File -FilePath $_.FullName -Encoding utf8 -Force
            Write-Host "✅ Fixed: $($_.Name)" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Could not fix: $($_.Name)" -ForegroundColor Yellow
    }
}
