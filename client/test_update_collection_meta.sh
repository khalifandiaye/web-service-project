#!/bin/bash
echo `curl --request PUT -H "Content-Type: application/atom+xml;type=entry" -d "<?xml version="1.0" encoding="utf-8"?><entry><id>kjadfjfl</id><title>Pictures of dogs</title></entry>" "http://127.0.0.1:3000/1" -D h`
