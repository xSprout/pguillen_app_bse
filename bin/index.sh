#!/bin/bash

# Set current wokring directory to this directory $SPLUNK_HOME/etc/apps/pguillen_app_bse/bin
# In this case $SPLUNK_HOME would be ./../../../../
SCRIPT_DIR=$( dirname "${BASH_SOURCE[0]}" )
APP_DIR=$SCRIPT_DIR/..
SPLUNK_HOME=$APP_DIR/../../..
$SPLUNK_HOME/bin/node $SPLUNK_HOME/etc/apps/pguillen_app_bse/bin/index.js "$SCRIPT_DIR"