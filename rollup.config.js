import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";

import pkg from './package.json';

export default {
  input: "./src/index.ts",
  output: [
    {
        format: 'cjs',
        file: pkg.main,
        exports: 'named',
        footer: 'module.exports = Object.assign(exports.default, exports);'
      },
      {
        format: 'esm',
        file: pkg.module
      }
  ],
  plugins: [
    terser({
      output: {
        ascii_only: true, // 仅输出ascii字符
      },
      compress: {
        pure_funcs: ["console.log"], // 去掉console.log函数
      },
    }),
    typescript({
      sourceMap: false
    })
  ],
};
