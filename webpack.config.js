const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    content: './src/content/index.js',
    background: './src/background/worker.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "src/popup/popup.html",
          to: "popup.html"
        },
        { 
          from: "src/options/options.html",
          to: "options.html"
        },
        { 
          from: "src/privacy.html",
          to: "privacy.html"
        },
        {
          from: "src/styles",
          to: "styles"
        },
        {
          from: "public/manifest.json",
          to: "manifest.json"
        },
        {
          from: "public/icons",
          to: "icons",
          noErrorOnMissing: true
        }
      ]
    })
  ],
  stats: {
    errorDetails: true
  }
};