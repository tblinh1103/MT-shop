@echo off
cd techstore
set GEMINI_API_KEY=AIzaSyBK5JyvnX8TNCWmA9MlhGQ4_iIIgt6_pY4
call mvnw spring-boot:run

@REM start http://127.0.0.1:5500/FE_END_USER/login.html
@REM start http://127.0.0.1:5500/FE_ADMIN/login.html

pause