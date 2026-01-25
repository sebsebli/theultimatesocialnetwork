#!/bin/bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin
npm install > install.log 2>&1
echo $? > install_exit_code.txt
