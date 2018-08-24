$SCRIPT_DIR=(Split-Path $MyInvocation.MyCommand.Path)
$APP_DIR="$SCRIPT_DIR\.."
$SPLUNK_HOME="$APP_DIR\..\..\.."
$NODE_EXEC="$SPLUNK_HOME\bin\node.exe"
$NODE_SCRIPT="$SPLUNK_HOME\etc\apps\pguillen_app_bse\bin\index.js"
$PRM="$NODE_SCRIPT", "$SCRIPT_DIR"
echo $SPLUNK_HOME
& $NODE_EXEC $PRM