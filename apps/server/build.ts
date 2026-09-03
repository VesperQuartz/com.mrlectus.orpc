//@ts-ignore
await Bun.build({
  entrypoints: ["./src/index.ts"],
  target: "bun",
  outdir: "./output",
  splitting: true,
});

export {};
