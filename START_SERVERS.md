# How to Start the Application

## Step 1: Start Django Backend

Open a terminal/command prompt in the project root and run:

```bash
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

## Step 2: Start React Frontend

Open a **NEW** terminal/command prompt, navigate to the frontend folder, and run:

```bash
cd frontend
npm start
```

You should see:
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

## Step 3: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

## Troubleshooting

### If port 8000 is already in use:
```bash
python manage.py runserver 8001
```
Then update `frontend/src/services/api.js` to use port 8001.

### If port 3000 is already in use:
React will automatically ask to use port 3001. Accept it.

### If you see "ERR_CONNECTION_REFUSED":
1. Make sure both servers are running
2. Check the terminal output for errors
3. Try http://127.0.0.1:3000 instead of localhost:3000

### If React won't compile:
```bash
cd frontend
npm install
npm start
```
