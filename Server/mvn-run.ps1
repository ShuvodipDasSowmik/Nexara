# Use this script from the Server folder to run the app with the correct spring-boot plugin goal.
# Fixes the common typo "spriing-boot" -> "spring-boot" and prefers the wrapper if present.

Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)

if (Test-Path "./mvnw.cmd") {
    Write-Output "Running project using Maven wrapper (mvnw.cmd) ..."
    .\mvnw.cmd spring-boot:run
}
else {
    Write-Output "Running project using system Maven (mvn)."
    Write-Output "If you previously ran 'mvn spriing-boot:run' note the typo. Using correct goal 'spring-boot:run' now."
    mvn spring-boot:run
}
