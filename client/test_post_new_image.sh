#!/bin/bash
echo `curl -s -H "Content-Type: image/jpeg" -H "Slug: bmw" --data-binary "@bmw.jpg"  "http://127.0.0.1:3000/1/images" -D h`
