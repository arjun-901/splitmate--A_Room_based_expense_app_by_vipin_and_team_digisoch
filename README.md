# Splitmate

Splitmate is a full-stack expense sharing app with a React frontend and an Express backend backed by MongoDB.

## Run Locally

Prerequisites:
- Node.js
- A MongoDB Atlas cluster

1. Install dependencies:
   `npm install`
2. Copy the sample environment file:
   `cp .env.example .env`
3. Update `.env` with your MongoDB Atlas connection string and a strong `JWT_SECRET`.
4. In MongoDB Atlas:
   - Create a database user
   - Add your current IP address to Network Access, or allow access from everywhere for development only
   - Copy your `mongodb+srv://...` connection string
5. Start the app:
   `npm run dev`

The backend reads these environment variables:

- `MONGODB_URI`: your MongoDB Atlas connection string
- `MONGODB_DB_NAME`: database name, defaults to `splitmate`
- `JWT_SECRET`: secret used to sign auth tokens

Example Atlas URI format:

```env
MONGODB_URI="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER_URL/splitmate?retryWrites=true&w=majority&appName=Splitmate"
```
