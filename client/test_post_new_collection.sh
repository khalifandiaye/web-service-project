#!/bin/bash
echo `curl -s -H "Content-Type: application/atom+xml;type=entry" -d "<?xml version="1.0" encoding="utf-8"?><entry><title>Pictures of cats</title><id>kjadfjfl</id></entry>" "http://127.0.0.1:3000/"`
