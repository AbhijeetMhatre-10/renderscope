# RenderScope

RenderScope analyzes a public URL with the PageSpeed Insights API. Copy `.env.example` to `.env.local` and set `VITE_PAGESPEED_API_KEY` if you want to use an API key for higher quota.

PageSpeed runs Lighthouse remotely. Simple sites may finish in seconds, while large sites such as GitHub can take around a minute or longer. The app uses the mobile strategy because it is generally faster than desktop; request timeout is configurable with `VITE_PAGESPEED_TIMEOUT_MS`.

## Development

```bash
npm install
npm run dev
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
