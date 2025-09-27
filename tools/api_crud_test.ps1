$ErrorActionPreference = 'Stop'

# Headers for demo auth
$headers = @{
  Authorization = 'Bearer demo-jwt-token'
  'x-demo-role' = 'officer'
}

# Project create payload aligned with backend model fields
$body = @{
  projectName = 'Test Road Project'
  schemeName = 'NH Expansion'
  landRequired = 100.5
  landAvailable = 25.75
  landToBeAcquired = 74.75
  type = 'greenfield'
  district = 'Pune'
  taluka = 'Mulshi'
  villages = @('Village A')
  estimatedCost = 250000000
  allocatedBudget = 50000000
  startDate = '2025-01-01'
  expectedCompletion = '2026-12-31'
  videoUrl = 'https://example.com/video'
  status = @{ overall = 'planning' }
}

Write-Host '--- Creating project (POST) ---'
$postResp = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/projects' -Headers $headers -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 6)
$postJson = $postResp | ConvertTo-Json -Depth 6
Write-Host $postJson

# Extract project id with fallbacks
$projectId = $null
if ($postResp.data -and $postResp.data._id) { $projectId = $postResp.data._id }
elseif ($postResp.data -and $postResp.data.id) { $projectId = $postResp.data.id }
elseif ($postResp.data -and $postResp.data.projectNumber) { $projectId = $postResp.data.projectNumber }

if (-not $projectId) {
  throw 'Failed to determine created project id'
}

# Update payload
$updateBody = @{
  landAvailable = 30.5
  status = @{ overall = 'active' }
}

Write-Host "--- Updating project (PUT) id=$projectId ---"
$putResp = Invoke-RestMethod -Method Put -Uri ("http://localhost:5000/api/projects/" + $projectId) -Headers $headers -ContentType 'application/json' -Body ($updateBody | ConvertTo-Json -Depth 6)
$putJson = $putResp | ConvertTo-Json -Depth 6
Write-Host $putJson

Write-Host '--- Listing projects (GET) ---'
$listResp = Invoke-RestMethod -Method Get -Uri 'http://localhost:5000/api/projects?limit=5'
$listJson = $listResp | ConvertTo-Json -Depth 6
Write-Host $listJson