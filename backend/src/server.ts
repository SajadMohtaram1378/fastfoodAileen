import { createApp } from "./app.js";

const port = process.env.HTTP_PORT || 5000;

async function start() {
  try {
    const app = await createApp();
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }
}

start();
