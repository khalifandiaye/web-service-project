#!/bin/bash
echo `curl --request GET -H "Accept: application/json" "http://127.0.0.1:3000/1" -D h`
