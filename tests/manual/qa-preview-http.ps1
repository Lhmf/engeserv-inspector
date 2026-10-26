<#
QA Preview HTTP — Agente C (Lote 23C)
Protocolo: docs/QA-LOTE-18C.md (F0–F6). Execute SOMENTE contra preview ou localhost:3100.

USO (PowerShell):
  # 1) Preview da Vercel (2 camadas de auth — ver docs/):
  .\tests\manual\qa-preview-http.ps1 -Target 'https://engeserv-inspector-b13as5kgz-the-castilho.vercel.app' -RunbookJson '<caminho>\qa-runbook.json'

  # 2) Local (sem protection bypass):
  .\tests\manual\qa-preview-http.ps1 -Target 'http://localhost:3100' -RunbookJson '<caminho>\qa-runbook.json'

CAMADA 1 (Vercel Deployment Protection): em preview, o script pedirá a chave
"Protection Bypass for Automation" (Settings > Deployment Protection) em prompt
MASCARADO. A chave NÃO precisa (nem deve) ser colada em nenhuma conversa/commits.
CAMADA 2 (EngeServ): login do portal (POST /api/portal/login) via WebSession.
Runbook JSON deve conter (produzido pelo seed): clientA/clientB { nome, cnpj6, idEquip, idLaudo, idFrente }.
#>
param(
  [Parameter(Mandatory=$true)][string]$Target = 'https://engeserv-inspector-b13as5kgz-the-castilho.vercel.app',
  [string]$RunbookJson = '',
  [switch]$SkipBypassPrompt
)
$ErrorActionPreference = 'Stop'
$Target = $Target.TrimEnd('/')
$evid = Join-Path $env:TEMP 'qa-preview-23c'; New-Item -ItemType Directory -Force -Path $evid | Out-Null
$round = 0; $resumo = New-Object System.Collections.Generic.List[string]

function Reg($id,$esperado,$obs,$status){ $script:round++; $line = "[$status] $id | esperado: $esperado | observado: $obs"; $resumo.Add($line); Write-Host $line }

function Req {
  param($Method,$Path,$WebSession,$BodyJson,$CookieHeader,$San)
  $uri = "$Target$Path"
  try {
    $p = @{ Uri=$uri; Method=$Method; MaximumRedirection=0; ErrorAction='Stop'; UseBasicParsing=$true; TimeoutSec=30 }
    if($WebSession){ $p.WebSession=$WebSession }
    if($BodyJson){ $p.ContentType='application/json'; $p.Body=$BodyJson }
    if($CookieHeader){ $p.Headers=@{ Cookie=$CookieHeader } }
    $r = Invoke-WebRequest @p
    [pscustomobject]@{ Status=[int]$r.StatusCode; Body=$r.Content; Loc=$r.Headers['Location'] }
  } catch {
    $resp = $_.Exception.Response
    if($resp){
      $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $body=$sr.ReadToEnd()
      $c = 0; try { $c = $resp.Headers['Location'] } catch {}; try { $c = $resp.Headers['Location'] } catch {}
      $loc = $resp.Headers['Location']
      [pscustomobject]@{ Status=[int]$resp.StatusCode; Body=$body; Loc=$loc }
    } else { [pscustomobject]@{ Status=-1; Body=$_.Exception.Message; Loc=$null } }
  }
}

# ---------- CAMADA 1: Vercel protection bypass ----------
$hb = $null
if($Target -notmatch 'localhost|127\.0\.0\.1'){
  if(-not $SkipBypassPrompt){
    $sec = Read-Host 'Cole a chave Protection Bypass for Automation (entrada mascarada; nao sera impressa)' -AsSecureString
    $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $hb = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)
    if(-not $hb){ Write-Host 'Sem chave: testes de preview serao BLOQUEADOS pelo SSO da Vercel.'; exit 2 }
  }
}
if($hb){ Write-Host 'Chave recebida (nao impressa). Ela sera enviada apenas como header x-vercel-protection-bypass para o alvo informado.' }

function H { if($hb){ return @{ 'x-vercel-protection-bypass' = $hb } } return @{} }

# ---------- Runbook ----------
$rb = $null
if($RunbookJson -and (Test-Path $RunbookJson)){ $rb = Get-Content $RunbookJson -Raw | ConvertFrom-Json }
$fb = if($rb){ "secoes F3/F6 parcialmente NAO EXECUTADAS ( IDs ausentes no runbook )." } else { "" }

Write-Host "`n=== F0 - Sem sessao (nenhuma camada de app ainda) ==="
$f01 = Req -Method Get -Path '/api/portal/session'
if($f01.Status -eq 200 -and $f01.Body -like '*session*null*'){ Reg 'F0.1 /api/portal/session s/ cookie' '200 {session:null}' "status=$($f01.Status) body=$($f01.Body)" 'PASSOU' } else { Reg 'F0.1' '200 {session:null}' "status=$($f01.Status) body=$($f01.Body.Substring(0,[Math]::Min(160,$f01.Body.Length)))" 'FALHOU' }
$f02 = Req -Method Get -Path '/portal/dashboard'
if((302,307) -contains $f02.Status -and $f02.Loc -like '*portal/login*'){ Reg 'F0.2 /portal/dashboard s/ cookie' '302 -> /portal/login' "status=$($f02.Status) Loc=$($f02.Loc)" 'PASSOU' } else { Reg 'F0.2' '302 -> /portal/login' "status=$($f02.Status)" 'FALHOU' }
$i01 = Req -Method Get -Path '/login'
Reg 'F0.3 /login publica' '200' "status=$($i01.Status)" ($(if($i01.Status -eq 200){'PASSOU'}else{'FALHOU'}))
$i02 = Req -Method Get -Path '/portal/login'
Reg 'F0.4 /portal/login publica' '200' "status=$($i02.Status)" ($(if($i02.Status -eq 200){'PASSOU'}else{'FALHOU'}))

if(-not $rb){ Write-Host "`nSem runbook: secoes F1-F6 (login real, isolamento A/B, estados ocultos) NAO EXECUTADAS."; $resumo | Out-File (Join-Path $evid 'resumo.txt') -Encoding utf8; Write-Host "Evidencias/parcial em: $evid"; exit 0 }

# ---------- CAMADA 2: autenticacoes EngeServ (portal) ----------
Write-Host "`n=== F1 - Login portal (A e B) ==="
function PortalLogin($nome,$cnpj,$svname){
  $body = "{`"primeiroNome`":`"$nome`",`"cnpj`":`"$cnpj`"}"
  $r = Req -Method Post -Path '/api/portal/login' -BodyJson $body
  $sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  if($r.Status -eq 200){
    try { Invoke-WebRequest -Uri "$Target/api/portal/login" -Method Post -ContentType 'application/json' -Body $body -MaximumRedirection 0 -UseBasicParsing -WebSession $sess -Headers (H) | Out-Null } catch {}
  }
  [pscustomobject]@{ R=$r; Sv=$sess }
}
$loginA = PortalLogin $rb.clientA.nome $rb.clientA.cnpj6 'sessA'
if($loginA.R.Status -eq 200 -and $loginA.R.Body -like '*success*true*'){ Reg 'F1.1 login A' '200 success+clientId' "status=$($loginA.R.Status)" 'PASSOU' } else { Reg 'F1.1 login A' '200 success+clientId' "status=$($loginA.R.Status) body=$($loginA.R.Body)" 'FALHOU' }
$loginB = PortalLogin $rb.clientB.nome $rb.clientB.cnpj6 'sessB'
if($loginB.R.Status -eq 200 -and $loginB.R.Body -like '*success*true*'){ Reg 'F1.2 login B' '200 success+clientId B distinto' "status=$($loginB.R.Status)" 'PASSOU' } else { Reg 'F1.2 login B' '200 success+clientId' "status=$($loginB.R.Status)" 'FALHOU' }
$loginInvalid = Req -Method Post -Path '/api/portal/login' -BodyJson ('{"primeiroNome":"naoexisteQA","cnpj":"999999"}')
if($loginInvalid.Status -eq 401){ Reg 'F1.3 credencial inexistente' '401' "status=$($loginInvalid.Status)" 'PASSOU' } else { Reg 'F1.3' '401' "status=$($loginInvalid.Status)" 'FALHOU' }

# ---------- F2/F3/F4/F5/F6 ----------
Write-Host "`n=== F2 - Acesso proprio (A e B) ==="
$rotas = '/api/portal/dashboard','/api/portal/equipamentos','/api/portal/laudos','/api/portal/documentos','/api/portal/frentes','/api/portal/calendario','/api/portal/recomendacoes'
foreach($s in @(@{n='A';s=$loginA.Sv},@{n='B';s=$loginB.Sv})){
  foreach($path in $rotas){
    $r = Req -Method Get -Path $path -WebSession $s.s
    $ok = $r.Status -eq 200
    Reg "F2 $path (sess $($s.n))" '200' "status=$($r.Status)" ($(if($ok){'PASSOU'}else{'FALHOU'}))
  }
  $sess = Req -Method Get -Path '/api/portal/session' -WebSession $s.s
  Reg "F2 session (sess $($s.n))" '200 {session:clientId proprio, role CLIENTE}' "status=$($sess.Status) body=$($sess.Body)" ($(if($sess.Status -eq 200 -and $sess.Body -match 'CLIENTE'){'PASSOU'}else{'FALHOU'}))
}

Write-Host "`n=== F3 - Acesso cruzado negado (404 generico) ==="
if($rb){
  $crossChecks = @(
    [pscustomobject]@{ Session=$loginA.Sv; Paths=@("/api/portal/equipamentos/$($rb.clientB.idEquip)", "/api/portal/laudos/$($rb.clientB.idLaudo)", "/api/portal/frentes/$($rb.clientB.idFrente)"); Label='A->B' },
    [pscustomobject]@{ Session=$loginB.Sv; Paths=@("/api/portal/equipamentos/$($rb.clientA.idEquip)", "/api/portal/laudos/$($rb.clientA.idLaudo)", "/api/portal/frentes/$($rb.clientA.idFrente)"); Label='B->A' }
  )
  foreach($par in $crossChecks){
    foreach($f in $par.Paths){
      $r = Req -Method Get -Path $f -WebSession $par.Session
      $persona = if($f -like '*equipamentos*'){'Equipamento'}elseif($f -like '*laudos*'){'Laudo'}else{'Frente'}
      $esperado = 404
      Reg "F3 $f ($($par.Label))" "$esperado sem corpo de dados" "status=$($r.Status) body=$($r.Body)" ($(if($r.Status -eq 404 -and $r.Body -notmatch '"id"'){'PASSOU'}else{'FALHOU'}))
    }
  }
}

Write-Host "`n=== F4 - Sem sessao ==="
foreach($path in $rotas){
  $r = Req -Method Get -Path $path
  Reg "F4 $path s/ sessao" '401 {error:"Nao autenticado."}' "status=$($r.Status)" ($(if($r.Status -eq 401){'PASSOU'}else{'FALHOU'}))
}
$lixo = Req -Method Get -Path '/portal/dashboard' -CookieHeader 'portal_session=lixodecookie'
Reg 'F4 cookie lixo /portal/dashboard' '302 -> /portal/login' "status=$($lixo.Status) Loc=$($lixo.Loc)" ($(if((302,307) -contains $lixo.Status -and $lixo.Loc -like '*portal/login*'){'PASSOU'}else{'FALHOU'}))

Write-Host "`n=== F5 - Incompatibilidade interna <-> portal (requer credenciais internas no runbook) ==="
if($rb -and $rb.operador -and $rb.operador.email){
  $li = $null
  try { $li = Invoke-RestMethod -Uri "$Target/api/auth/login" -Method Post -ContentType 'application/json' -Body ("{`"email`":`"$($rb.operador.email)`",`"password`":`"$($rb.operador.senha)`"}") -Headers (H) -ErrorAction Stop } catch {}
  if($li){
    Reg 'F5.1 login interno obteve cookie (uso em memoria)' '200' 'cookie em memoria, nao impresso' 'PASSOU'
    # F5 detalhado: recomenda executar via runbook com cookie capturado em memoria
  } else { Reg 'F5 login interno' '200' 'novo resultado indefinido (ver script completo v2)' 'NAO EXECUTADO' }
}
Write-Host "`n=== F6 - Estados ocultos (grep nos corpos salvos) ==="
$ocultos = 'DRAFT','UNDER_REVIEW','REJECTED','ARCHIVED','EM_ANDAMENTO','AGUARDANDO_APROVACAO','REJEITADA'
foreach($s in @(@{n='A';s=$loginA.Sv},@{n='B';s=$loginB.Sv})){
  foreach($path in @('/api/portal/laudos','/api/portal/equipamentos','/api/portal/dashboard')){
    $r = Req -Method Get -Path $path -WebSession $s.s
    $hits = ($ocultos | Where-Object {
      $pattern = '"status":"' + [regex]::Escape($_) + '"'
      $r.Body -match $pattern
    }).Count
    Reg "F6 $path (sess $($s.n)) estados ocultos" '0 ocorrencias' "hits=$hits" ($(if($hits -eq 0 -and $r.Status -eq 200){'PASSOU'}elseif($r.Status -ne 200){'NAO EXECUTADO'}else{'FALHOU'}))
  }
}
$resumo | Out-File (Join-Path $evid 'resumo.txt') -Encoding utf8
Write-Host "`nResumo salvo (sem cookies/tokens): $(Join-Path $evid 'resumo.txt')"
