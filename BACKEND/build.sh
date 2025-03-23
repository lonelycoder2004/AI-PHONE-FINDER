#!/bin/bash

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start the application
echo "Starting the application..."
npm start