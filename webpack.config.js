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
  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'services': path.resolve(__dirname, 'src/services'),
      'components': path.resolve(__dirname, 'src/components')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: "88"
                },
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-transform-runtime"
            ]
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
          from: "src/styles",
          to: "styles",
          noErrorOnMissing: true
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
  ]
};