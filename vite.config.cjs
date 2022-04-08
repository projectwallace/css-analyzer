const path = require('path');
const { defineConfig } = require('vite');
const typescript = require('rollup-plugin-typescript2')
const pkg = require('./package.json')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, pkg.source),
      name: 'analyzeCss',
      fileName: (format) => `analyzer.${format}.js`,
    },
    rollupOptions: {
      external: ['css-tree/walker', 'css-tree/parser'],
      plugins: [
        typescript({
          tsconfigDefaults: {
            compilerOptions: {
              declaration: true,
              allowJs: true,
              emitDeclarationOnly: true,
              declarationDir: 'dist',
            },
            files: [path.resolve(__dirname, pkg.source)],
          }
        })
      ]
    },
  }
})