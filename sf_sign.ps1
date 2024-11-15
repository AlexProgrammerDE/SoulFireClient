param (
    [string]$filePath
)

Write-Host "SF starting signing $filePath"

Submit-SigningRequest -Force -InputArtifactPath "$filePath" -ApiToken "$env:SIGNPATH_API_KEY" -OrganizationId "e091b552-3623-4d9d-83d7-059d8f32978b" -ProjectSlug "SoulFireClient" -SigningPolicySlug "$env:SIGNPATH_POLICY_SLUG" -OutputArtifactPath "$filePath" -WaitForCompletion

Write-Host "SF finished signing $filePath"
