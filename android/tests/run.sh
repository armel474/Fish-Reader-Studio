#!/bin/sh
set -eu
project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
test_output=$(mktemp -d)
trap 'rm -rf "$test_output"' EXIT HUP INT TERM
java com.sun.tools.javac.Main -d "$test_output" \
  "$project_root/app/src/main/java/app/fishreadv2/ScanSession.java" \
  "$project_root/tests/ScanSessionTest.java"
java -cp "$test_output" app.fishreadv2.ScanSessionTest
