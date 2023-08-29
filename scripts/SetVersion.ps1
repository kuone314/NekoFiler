Param(
  [String]$version
)

$trgFile = "src\CurrentVersion.tsx"
$content = Get-Content $trgFile

$replaceFrom = 'return "Develop";'
$replaceTo = 'return "' + $version + '";'
$replaced = $content.Replace($replaceFrom, $replaceTo )

Write-Output $replaced > $trgFile
