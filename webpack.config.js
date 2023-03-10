const HtmlWebpackPlugin = require("html-webpack-plugin");
const ESLintPlugin = require('eslint-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");
// const webpack = require('webpack');

const SRC_DIR = path.join(__dirname, "/src");
const DIST_DIR = path.join(__dirname, "/dist");

const devPlugins = [
    new HtmlWebpackPlugin({
        chunks: ["tcs"],
        template: path.join(__dirname, "index.html"),
        filename: path.join(DIST_DIR, "index.html"),
        inject: "head",
    }),
    new HtmlWebpackPlugin({
        chunks: ["tcs"],
        template: path.join(__dirname, "big.html"),
        filename: path.join(DIST_DIR, "big.html"),
        inject: "head",
    })
];

const terserOptions = (argv) => {
    const isProd = argv.mode === "production";
    if (isProd) {
        return {
            parallel: true,
            terserOptions: {
                compress: {
                    drop_console: true,
                },
                format: {
                    comments: false,
                },
                warnings: false,
            },
        };
    }

    return {
        include: /\.min\.js$/,
        parallel: true,
        terserOptions: {
            sourceMap: true
        }
    };
};

module.exports = (env, argv) => ({
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin(terserOptions(argv))]
    },
    entry: {
        "tcs": path.join(SRC_DIR, "app.js"),
        "tcs.min": path.join(SRC_DIR, "app.js")
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.(html)$/,
                exclude: /node_modules/,
                use: {
                    loader: "html-loader",
                    options: {minimize: false}
                }
            },
        ]
    },
    output: {
        hashFunction: "sha256",
        filename: "[name].js",
        library: {
            type: 'umd'
        },
        path: DIST_DIR,
        publicPath: argv.mode !== "production" ? "/" : "../dist/",
        umdNamedDefine: true
    },
    devtool: argv.mode !== "production" ? "source-map" : false,
    plugins: argv.mode !== "production" ? devPlugins : [new ESLintPlugin()],
    devServer: {
        static: SRC_DIR,
        hot: true,
        port: 9000,
        open: true
    }
});

