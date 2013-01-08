#!/bin/bash
echo `curl -s -H "Content-Type: application/atom+xml;type=entry" -d "<?xml version="1.0" encoding="utf-8"?><entry><id>kjadfjfl</id><title>Cars</title></entry>" "http://127.0.0.1:3000/"`
