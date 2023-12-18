#!/bin/bash
#Stopping existing node servers
echo "Stopping any existing node servers"
# pkill node
/usr/bin/pm2 stop all