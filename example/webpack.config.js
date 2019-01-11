const tsTransformerMeta = require("ts-transformer-meta/transformer").default
module.exports = {
  entry: "./main.ts",
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          getCustomTransformers(program) {
            return {
              before: [tsTransformerMeta(program)],
            }
          },
        },
      },
    ],
  },
}
