# Auth Testing Playbook

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify: bcrypt hash starts with `$2b$`, email index is unique.

## Step 2: API Testing
```bash
# Register
curl -c cookies.txt -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test2@test.com","password":"test123"}'

# Login
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@emailboost.com","password":"admin123"}'

# Me
curl -b cookies.txt http://localhost:8001/api/auth/me

# Logout
curl -b cookies.txt -X POST http://localhost:8001/api/auth/logout
```

## Step 3: Generate Test
```bash
curl -b cookies.txt -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"email_draft":"product launch","industry":"SaaS","email_type":"Promotional"}'
```

## Test Credentials
- Admin: admin@emailboost.com / admin123 (pro)
- Test: test@emailboost.com / test123 (free)
