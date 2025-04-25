#!/data/data/com.termux/files/usr/bin/bash

# Exit on error and print commands
set -e
set -x

# Update and install required repo
pkg update -y && pkg upgrade -y
pkg install -y x11-repo

# Install OpenJDK 21
pkg install -y openjdk-21

# Create soulfire dir and set as pwd
mkdir -p ~/soulfire
cd ~/soulfire

# Define the jar file name
JAR_NAME="SoulFireDedicated-$1.jar"

# Only download if the jar does not exist
if [ ! -f "$JAR_NAME" ]; then
  curl -L -o "$JAR_NAME" "https://github.com/AlexProgrammerDE/SoulFire/releases/download/$1/$JAR_NAME"
else
  echo "$JAR_NAME already exists, skipping download."
fi

# Prepare rundir
mkdir -p ~/soulfire/rundir
cd ~/soulfire/rundir

# Run SoulFire
java $2 -jar ~/soulfire/jars/$JAR_NAME
