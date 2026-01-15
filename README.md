# removebackground

> Remove image backgrounds instantly — 100% in your browser. Your images never leave your device.

## Features

- 🔒 **Privacy First** — All processing happens in your browser. We never see your images.
- ⚡ **Fast** — Powered by machine learning running directly on your device.
- 📴 **Works Offline** — After the first load, works without internet.
- 🎨 **High Quality** — Clean edges, handles hair and complex backgrounds.
- 💾 **No Account** — Just drop an image and download the result.

## How It Works

removebackground uses [Transformers.js](https://github.com/xenova/transformers.js) to run the RMBG-1.4 background removal model directly in your browser using WebGPU/WebGL acceleration.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

## Tech Stack

- [Next.js 14](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [@xenova/transformers](https://github.com/xenova/transformers.js) — Browser ML inference
- [Vitest](https://vitest.dev/) — Unit testing
- [Playwright](https://playwright.dev/) — E2E testing

## Privacy

**Your images never leave your device.** 

- No server uploads
- No analytics on your images
- No account required
- Model cached locally for offline use

## License

MIT
