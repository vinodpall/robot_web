export {}

declare module './env.config.js' {
  const envConfig: Record<string, string>
  export default envConfig
}
