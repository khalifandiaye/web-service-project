#!/bin/bash
echo `curl -s -H "Content-Type: text/plain" -d "This is the new content posted to a resource" "http://127.0.0.1:3000/"`
