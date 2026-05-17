const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'auto'
  },
  experiments: {
    topLevelAwait: true
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'container',
      remotes: {
        pedido: 'pedido@http://localhost:3002/remoteEntry.js'
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: false
        },
        'react-dom': {
          singleton: true,
          requiredVersion: false
        }
      }
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public', to: '.', globOptions: { ignore: ['**/index.html'] } }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: 3000,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
};
