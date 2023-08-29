Param(
  [String]$version
)

$trgFile = "src\CurrentVersion.tsx"
$content = Get-Content $trgFile

$replaceFrom = 'return "Develop";'
$replaceTo = 'return "' + $version + '";'
$replaced = $content.Replace($replaceFrom, $replaceTo )

$UTF8woBOM = New-Object "System.Text.UTF8Encoding" -ArgumentList @($false)
[System.IO.File]::WriteAllLines($trgFile, $replaced, $UTF8woBOM)
