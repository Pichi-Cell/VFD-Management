#!/bin/sh
set -e

if [ -f "/etc/nginx/certs/cert.pem" ] && [ -f "/etc/nginx/certs/key.pem" ]; then
    echo "SSL certificates found. Enabling SSL..."
    cp /etc/nginx/custom-templates/nginx.ssl.conf.template /etc/nginx/conf.d/default.conf
else
    echo "No SSL certificates found. Falling back to HTTP..."
    cp /etc/nginx/custom-templates/nginx.http.conf.template /etc/nginx/conf.d/default.conf
fi
