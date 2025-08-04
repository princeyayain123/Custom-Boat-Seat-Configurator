export default function handler(req, res) {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
    window.env = {
      EMAIL_SERVICE_ID: "${process.env.VITE_EMAIL_SERVICE_ID}",
      EMAIL_TEMPLATE_ID: "${process.env.VITE_EMAIL_TEMPLATE_ID}",
      EMAIL_PUBLIC_KEY: "${process.env.VITE_EMAIL_PUBLIC_KEY}",
      UPLOAD_TOKEN: "${process.env.VITE_UPLOAD_TOKEN}"
    };
  `);
}