const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-ts");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (webpackConfigEnv, argv) => {
  const orgName = "codehub";
  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName: "root-config",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

  return merge(defaultConfig, {
    // modify the webpack config however you'd like to by adding to this object
    entry: path.resolve(__dirname, "src/codehub-root-config"),
    output: {
      filename: "codehub-root-config.js",
      libraryTarget: "system",
      path: path.resolve(__dirname, "dist"),
    },
    devtool: "source-map",
    module: {
      rules: [
        { parser: { system: false } },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [{ loader: "babel-loader" }],
        },
      ],
    },
    devServer: {
      historyApiFallback: true,
      allowedHosts: ['all']
    },
    externals: ["single-spa", /^@codehub\/.+$/],
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        inject: false,
        template: "src/index.ejs",
        templateParameters: {
          isLocal: webpackConfigEnv && webpackConfigEnv.isLocal,
          orgName,
        },
      }),
    ],
  });
};
