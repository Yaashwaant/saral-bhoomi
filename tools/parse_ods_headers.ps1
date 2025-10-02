param(
    [Parameter(Mandatory=$true)]
    [string]$Path
)

# Parse ODS (ZIP) and list column headers from the first row of each sheet
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = $null
$openedPath = $Path
try {
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($openedPath)
    } catch {
        # File might be locked by another process; copy to a temp path and open that
        $tmpName = [System.IO.Path]::Combine(
            [System.IO.Path]::GetTempPath(),
            ([System.IO.Path]::GetFileNameWithoutExtension($Path) + '.' + [Guid]::NewGuid().ToString() + '.ods')
        )
        [System.IO.File]::Copy($Path, $tmpName, $true)
        $openedPath = $tmpName
        $zip = [System.IO.Compression.ZipFile]::OpenRead($openedPath)
    }

    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'content.xml' }
    if (-not $entry) {
        Write-Error "content.xml not found in ODS archive"
        exit 1
    }

    $sr = New-Object System.IO.StreamReader($entry.Open())
    try {
        $xmlString = $sr.ReadToEnd()
    }
    finally {
        $sr.Close()
    }
}
finally {
    if ($zip) { $zip.Dispose() }
    if ($openedPath -ne $Path -and (Test-Path $openedPath)) { Remove-Item -Force $openedPath }
}

$xml = New-Object System.Xml.XmlDocument
$xml.LoadXml($xmlString)

$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('office','urn:oasis:names:tc:opendocument:xmlns:office:1.0')
$ns.AddNamespace('table','urn:oasis:names:tc:opendocument:xmlns:table:1.0')
$ns.AddNamespace('text','urn:oasis:names:tc:opendocument:xmlns:text:1.0')

$tables = $xml.SelectNodes('//table:table', $ns)

function Is-NumericOnly {
    param([string]$s)
    if (-not $s) { return $false }
    $t = $s.Trim()
    if ($t.Length -eq 0) { return $false }
    return ($t -match '^(?:[-+]?\d{1,3}(?:,\d{3})+|[-+]?\d+)(?:\.\d+)?$')
}

function Has-Letters {
    param([string]$s)
    if (-not $s) { return $false }
    return ($s -match '\p{L}')
}

function Get-RowValues {
    param($rowNode)
    $vals = New-Object System.Collections.Generic.List[string]
    $cells = $rowNode.SelectNodes('table:table-cell', $ns)
    if ($cells) {
        foreach ($c in $cells) {
            $repAttr = $c.Attributes['table:number-columns-repeated']
            $rep = if ($repAttr) { [int]$repAttr.Value } else { 1 }
            $texts = $c.SelectNodes('text:p', $ns)
            $v = ''
            if ($texts -and $texts.Count -gt 0) { $v = ($texts | ForEach-Object { $_.InnerText }) -join ' ' }
            for ($i = 0; $i -lt $rep; $i++) { $vals.Add($v) }
        }
    }
    return $vals
}

foreach ($t in $tables) {
    $sheetNameAttr = $t.Attributes['table:name']
    $sheetName = if ($sheetNameAttr) { $sheetNameAttr.Value } else { 'Sheet' }

    # Prefer explicit header rows if present
    $headerRows = $t.SelectNodes('table:table-header-rows/table:table-row', $ns)
    $selectedHeader = $null
    if ($headerRows -and $headerRows.Count -gt 0) {
        # Use the header row that has the highest textual ratio
        $bestScore = -1
        foreach ($hr in $headerRows) {
            $vals = Get-RowValues $hr
            $nonEmpty = $vals | Where-Object { $_ -and $_.Trim().Length -gt 0 }
            $count = $nonEmpty.Count
            if ($count -eq 0) { continue }
            $textualCount = ($nonEmpty | Where-Object { Has-Letters $_ -and -not (Is-NumericOnly $_) }).Count
            $uniqueCount = ($nonEmpty | Select-Object -Unique).Count
            $ratio = [double]$textualCount / [double]$count
            $score = $ratio + (0.2 * ([double]$uniqueCount / [double]$count))
            if ($score -gt $bestScore) { $bestScore = $score; $selectedHeader = $hr }
        }
        # If explicit header appears numeric-only, ignore it
        if ($selectedHeader) {
            $vals = Get-RowValues $selectedHeader
            $nonEmpty = $vals | Where-Object { $_ -and $_.Trim().Length -gt 0 }
            $textualCount = ($nonEmpty | Where-Object { Has-Letters $_ -and -not (Is-NumericOnly $_) }).Count
            $textualRatio = if ($nonEmpty.Count -gt 0) { [double]$textualCount / [double]$nonEmpty.Count } else { 0 }
            if ($textualRatio -lt 0.4) { $selectedHeader = $null }
        }
    }

    $rows = $t.SelectNodes('table:table-row', $ns)
    if (-not $rows -or $rows.Count -eq 0) { continue }

    $headers = $null

    # User hint: 4th and 5th rows contain human-readable column names. Try merging them first.
    $forcedHeaders = $null
    if ($rows.Count -ge 5) {
        $row4 = $rows[3]
        $row5 = $rows[4]
        $vals4 = Get-RowValues $row4
        $vals5 = Get-RowValues $row5
        $maxLen = [Math]::Max($vals4.Count, $vals5.Count)
        $merged = New-Object System.Collections.Generic.List[string]
        for ($ci = 0; $ci -lt $maxLen; $ci++) {
            $s4 = if ($ci -lt $vals4.Count) { $vals4[$ci] } else { '' }
            $s5 = if ($ci -lt $vals5.Count) { $vals5[$ci] } else { '' }
            $t4 = if ($s4) { $s4.Trim() } else { '' }
            $t5 = if ($s5) { $s5.Trim() } else { '' }
            $choice = ''
            if ($t4 -and (Has-Letters $t4) -and -not (Is-NumericOnly $t4)) {
                if ($t5 -and (Has-Letters $t5) -and -not (Is-NumericOnly $t5)) {
                    $choice = "$t4 - $t5"
                } else {
                    $choice = $t4
                }
            } elseif ($t5 -and (Has-Letters $t5) -and -not (Is-NumericOnly $t5)) {
                $choice = $t5
            } elseif ($t4) {
                $choice = $t4
            } elseif ($t5) {
                $choice = $t5
            }
            $merged.Add($choice)
        }
        $nonEmptyForced = $merged | Where-Object { $_ -and $_.Trim().Length -gt 0 }
        $textualForced = ($nonEmptyForced | Where-Object { Has-Letters $_ -and -not (Is-NumericOnly $_) }).Count
        $ratioForced = if ($nonEmptyForced.Count -gt 0) { [double]$textualForced / [double]$nonEmptyForced.Count } else { 0 }
        if ($nonEmptyForced.Count -ge 3 -and $ratioForced -ge 0.3) { $forcedHeaders = $merged }
    }

    if (-not $selectedHeader) {
        if ($forcedHeaders) {
            $headers = $forcedHeaders
        } else {
            $maxRowsToInspect = [Math]::Min(200, $rows.Count)
            $bestRowIndex = -1
            $bestRowHeaders = $null
            $bestScore = -1

            for ($ri = 0; $ri -lt $maxRowsToInspect; $ri++) {
                $row = $rows[$ri]
                $headersCandidate = Get-RowValues $row
                $nonEmpty = $headersCandidate | Where-Object { $_ -and $_.Trim().Length -gt 0 }
                $nonEmptyCount = $nonEmpty.Count
                if ($nonEmptyCount -lt 3) { continue }
                $textualCount = ($nonEmpty | Where-Object { Has-Letters $_ -and -not (Is-NumericOnly $_) }).Count
                $uniqueCount = ($nonEmpty | Select-Object -Unique).Count
                $textualRatio = [double]$textualCount / [double]$nonEmptyCount
                $score = $textualRatio + (0.2 * ([double]$uniqueCount / [double]$nonEmptyCount))
                if ($score -gt $bestScore) { $bestScore = $score; $bestRowIndex = $ri; $bestRowHeaders = $headersCandidate }
                if ($textualRatio -ge 0.7 -and $nonEmptyCount -ge 5) { break }
            }

            # Fallback: first non-empty row with >= 3 cells
            if ($bestRowIndex -eq -1) {
                for ($ri = 0; $ri -lt $maxRowsToInspect; $ri++) {
                    $row = $rows[$ri]
                    $vals = Get-RowValues $row
                    $nonEmpty2 = $vals | Where-Object { $_ -and $_.Trim().Length -gt 0 }
                    if ($nonEmpty2.Count -ge 3) { $bestRowIndex = $ri; $bestRowHeaders = $vals; break }
                }
            }

            if ($bestRowIndex -eq -1) { continue }
            $headers = $bestRowHeaders
        }
    } else {
        $headers = Get-RowValues $selectedHeader
    }

    # Clean headers: remove numeric-only, trim, drop empties, dedupe while preserving order
    $clean = New-Object System.Collections.Generic.List[string]
    foreach ($h in $headers) {
        $t = if ($h) { $h.Trim() } else { '' }
        if (-not $t) { continue }
        # If string is whitespace-only (including unicode whitespaces), skip
        if (($t -replace '\s','') -eq '') { continue }
        # Normalize spaces
        $t = ($t -replace '\s+',' ').Trim()
        if (Is-NumericOnly $t) { continue }
        if (-not $clean.Contains($t)) { $clean.Add($t) }
    }

    Write-Output "Sheet: $sheetName"
    Write-Output ("Column count: " + $clean.Count)
    for ($i = 0; $i -lt $clean.Count; $i++) {
        Write-Output ("- " + ($i + 1) + ". " + $clean[$i])
    }
    Write-Output ""
 }
}