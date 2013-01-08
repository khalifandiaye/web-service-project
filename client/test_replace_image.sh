#!/bin/bash
echo `curl --request PUT -H "Content-Type: image/jpeg"  --data-binary "@bmw.jpg"  "http://127.0.0.1:3000/1/images/1/image" -D h`
