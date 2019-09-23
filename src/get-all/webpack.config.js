const nodeExternals = require('webpack-node-externals');

module.exports = {
  devtool: "source-map",
  resolve: {
    extensions: [".js", ".ts"]
  },
  output: {
    libraryTarget: 'commonjs2'
  },
  target: "node",
  externals: ['aws-sdk'],
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },  
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.ts?$/,
        loader: "ts-loader",
        exclude: /(node_modules|bower_components)/
      }
    ]
  },

  mode: "development"
};