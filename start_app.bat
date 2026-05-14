@echo off
title Expense Tracker Server
echo =========================================
echo Starting Expense Tracker Backend Server...
echo =========================================
start /b python app.py
echo.
echo Waiting for server to start...
timeout /t 3 >nul
echo.
echo Opening the application in your web browser...
start index.html
echo.
echo -----------------------------------------
echo DO NOT CLOSE THIS WINDOW!
echo Closing this window will shut down the database connection.
echo -----------------------------------------
